import { AppState, type AppStateStatus } from "react-native";
import { fetch as streamingFetch } from "expo/fetch";
import { API_ROOT, BASE_URL, currentAccessToken, onSessionChange } from "@/services/http";
import type { RealtimeEvent, RealtimeEventType } from "@/data/events";

/**
 * The live connection to the server.
 *
 * One connection for the whole app, not one per screen. Screens subscribe to
 * the event types they care about and are told when to refetch; they never
 * know a socket exists. That boundary is the point — the alternative is
 * connection logic sprinkled through twenty screens, each with its own idea of
 * when to reconnect.
 *
 * **Why not `EventSource`.** React Native's EventSource cannot set headers, and
 * the access token must travel in the Authorization header rather than a query
 * string that every proxy and access log between here and the server would
 * keep. So the stream is read with Expo's streaming `fetch` and the SSE wire
 * format is parsed here.
 *
 * **What arrives is a hint, not data.** An event says "request 123 changed";
 * the screen then fetches through the ordinary authorised endpoint. The server
 * therefore stays the only thing deciding what this person may see, and a bug
 * in this file cannot leak somebody else's details onto a screen.
 */

type Listener = (event: RealtimeEvent) => void;

/** Subscribers by event type, plus `resync` handled as its own type. */
const listeners = new Map<RealtimeEventType, Set<Listener>>();

let controller: AbortController | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;
let running = false;
let lastEventId: number | null = null;

/** Set once the app has a session. Without one there is nothing to stream. */
let enabled = false;

type Status = "idle" | "connecting" | "live" | "offline";
let status: Status = "idle";
const statusListeners = new Set<(value: Status) => void>();

function setStatus(next: Status): void {
  if (status === next) return;
  status = next;
  for (const listener of statusListeners) listener(next);
}

export function realtimeStatus(): Status {
  return status;
}

export function onRealtimeStatus(listener: (value: Status) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

/**
 * Subscribes to one or more event types.
 *
 * Returns the unsubscribe function, which callers must actually call: a screen
 * that unmounts while leaving a listener behind holds its closure — and its
 * stale `reload` — alive for the rest of the session.
 */
export function onRealtime(types: RealtimeEventType[], listener: Listener): () => void {
  for (const type of types) {
    const set = listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    listeners.set(type, set);
  }

  return () => {
    for (const type of types) {
      const set = listeners.get(type);
      if (!set) continue;
      set.delete(listener);
      if (set.size === 0) listeners.delete(type);
    }
  };
}

function dispatch(event: RealtimeEvent): void {
  const set = listeners.get(event.type);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch {
      // A screen's handler throwing must not kill the connection every other
      // screen is sharing.
    }
  }
}

/**
 * Backoff with jitter.
 *
 * Jitter matters more than the curve: when the server restarts, every phone
 * reconnects at once, and without it they would keep arriving in lockstep and
 * knock it over again each time.
 */
function backoffMs(): number {
  const base = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
  return base / 2 + Math.random() * (base / 2);
}

function scheduleReconnect(): void {
  if (!enabled || reconnectTimer) return;
  const delay = backoffMs();
  attempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connect();
  }, delay);
}

async function connect(): Promise<void> {
  if (!enabled || running || !BASE_URL) return;
  running = true;
  setStatus("connecting");

  controller = new AbortController();

  try {
    const token = await currentAccessToken();

    const response = await streamingFetch(`${API_ROOT}/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
        ...(lastEventId === null ? {} : { "Last-Event-ID": String(lastEventId) }),
      },
      signal: controller.signal,
    });

    if (response.status === 401) {
      // The token was refused rather than merely expired — the session is
      // gone. Stop: reconnecting in a loop against a dead session would be a
      // request every second forever.
      enabled = false;
      setStatus("offline");
      return;
    }

    if (!response.ok || !response.body) {
      setStatus("offline");
      scheduleReconnect();
      return;
    }

    // Connected. The next failure starts its backoff from the beginning.
    attempt = 0;
    setStatus("live");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Frames are separated by a blank line. A partial frame stays in the
      // buffer until the rest of it arrives — TCP does not owe us whole
      // messages, and a naive split here drops an event roughly every time
      // one straddles a packet boundary.
      let split: number;
      while ((split = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);
        handleFrame(frame);
      }
    }

    // The server closed cleanly: it recycles streams before the access token
    // expires. Reconnect promptly rather than backing off.
    setStatus("offline");
    if (enabled) {
      attempt = 0;
      scheduleReconnect();
    }
  } catch {
    // Aborted by us, or the network vanished. Indistinguishable here, and the
    // response is the same either way.
    setStatus("offline");
    scheduleReconnect();
  } finally {
    running = false;
  }
}

function handleFrame(frame: string): void {
  // A comment is a heartbeat and carries no fields.
  if (frame.startsWith(":")) return;

  let id: number | null = null;
  let data: string | null = null;

  for (const line of frame.split("\n")) {
    if (line.startsWith("id: ")) {
      const parsed = Number(line.slice(4));
      if (Number.isInteger(parsed)) id = parsed;
    } else if (line.startsWith("data: ")) {
      data = line.slice(6);
    }
  }

  if (!data) return;

  let event: RealtimeEvent;
  try {
    event = JSON.parse(data) as RealtimeEvent;
  } catch {
    return;
  }

  // Recorded only for events that carry one, and only after the event has
  // parsed: resuming from an id whose event we failed to apply would skip it.
  if (id !== null) lastEventId = id;

  dispatch(event);
}

/**
 * Starts streaming. Called once the app has a session.
 *
 * Idempotent, because it is called from a layout effect that can run more than
 * once and from the foreground handler.
 */
export function startRealtime(): void {
  if (!BASE_URL) return;
  enabled = true;
  if (!running && !reconnectTimer) void connect();
}

/** Stops streaming, on sign-out. Forgets the position: the next session is new. */
export function stopRealtime(): void {
  enabled = false;
  lastEventId = null;
  attempt = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  controller?.abort();
  controller = null;
  setStatus("idle");
}

/**
 * Backgrounding and foregrounding.
 *
 * iOS suspends the process, and a socket held across that comes back believing
 * it is connected while receiving nothing — the worst failure mode available,
 * because the UI looks live and is not. So the stream is dropped on the way
 * out and rebuilt on the way in, where `Last-Event-ID` either fills the gap or
 * the server answers `resync`.
 */
let appState: AppStateStatus = AppState.currentState;

AppState.addEventListener("change", (next) => {
  const wasActive = appState === "active";
  appState = next;

  if (!enabled) return;

  if (next === "active" && !wasActive) {
    // Straight back, no backoff: the person is looking at the screen now.
    attempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (!running) void connect();
    return;
  }

  if (next !== "active" && wasActive) {
    controller?.abort();
    controller = null;
  }
});

/**
 * The connection follows the session, wherever it changed.
 *
 * Registered at import time so no screen has to remember: signing in, signing
 * out, and restoring a stored session on launch all go through
 * `saveSession`, and all three end up here.
 */
onSessionChange((signedIn) => {
  if (signedIn) startRealtime();
  else stopRealtime();
});
