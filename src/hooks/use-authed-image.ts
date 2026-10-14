import { useEffect, useState } from "react";
import type { ImageURISource } from "react-native";
import { currentAccessToken, onSessionChange } from "@/services/http";

/**
 * An image source that can actually load a photo from our own API.
 *
 * Profile photos are served from an authenticated endpoint, which redirects
 * to a short-lived signed URL. `<Image source={{ uri }}>` sends no headers,
 * so every one of those requests came back 401 and every avatar in the app
 * rendered as an empty circle — on match cards, ride cards, the group list
 * and the person's own profile. It read as "nobody has uploaded a photo"
 * rather than as a failure, which is why it survived so long.
 *
 * The alternative was to make the photo address unauthenticated and carry a
 * signature instead. That would have worked, and it would also have made
 * every member photo fetchable by anybody holding the link. Keeping the
 * endpoint behind a session and teaching the client to authenticate is the
 * version that matches what the privacy policy says.
 *
 * Anything that is not one of our photo URLs — a local `file://` preview from
 * the image picker, or a photo uploaded before object storage existed and
 * stored as a plain URL — is passed straight through.
 */

/** Matched on the path, not the host, so it survives a domain change. */
const PHOTO_PATH = "/api/v1/photos/";

export function useAuthedImage(url?: string | null): ImageURISource | undefined {
  const needsAuth = Boolean(url && url.includes(PHOTO_PATH));
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!needsAuth) return;

    let cancelled = false;

    const load = () => {
      currentAccessToken()
        .then((value) => {
          if (!cancelled) setToken(value);
        })
        // Swallowed deliberately. No token means no photo, which is the
        // placeholder initial — the same thing the user sees before they
        // upload one, and not worth an error state of its own.
        .catch(() => {
          if (!cancelled) setToken(null);
        });
    };

    load();

    // A sign-out must drop the old token rather than keep rendering with it,
    // and a sign-in as somebody else must fetch theirs.
    const unsubscribe = onSessionChange(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [needsAuth, url]);

  if (!url) return undefined;
  if (!needsAuth) return { uri: url };

  // Held back until the token is in hand. Rendering the URI without it would
  // fire a request that 401s, and the failure is then cached against that URI
  // by the image layer — so the photo stays blank even once the token
  // arrives.
  if (!token) return undefined;

  return { uri: url, headers: { Authorization: `Bearer ${token}` } };
}
