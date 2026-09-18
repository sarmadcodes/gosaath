import { WEEKDAYS, type DaySchedule, type Weekday } from "@/data/types";

/**
 * Helpers for per-day commute schedules.
 *
 * Most people travel at the same time every day, so the UI optimises for that
 * and treats differing times as the deliberate exception. These helpers are
 * what let a screen ask "is this uniform?" before deciding how to render it.
 */

export function daysOf(schedule: DaySchedule[]): Weekday[] {
  return [...schedule]
    .sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day))
    .map((entry) => entry.day);
}

export function sortSchedule(schedule: DaySchedule[]): DaySchedule[] {
  return [...schedule].sort(
    (a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day),
  );
}

/** True when every day carries identical departure and return times. */
export function isUniform(schedule: DaySchedule[]): boolean {
  if (schedule.length <= 1) return true;
  const [first, ...rest] = schedule;
  return rest.every(
    (entry) =>
      entry.arriveBy === first!.arriveBy &&
      entry.leaveCampusAt === first!.leaveCampusAt,
  );
}

/** The shared times when uniform, otherwise null. */
export function uniformTimes(schedule: DaySchedule[]) {
  if (schedule.length === 0 || !isUniform(schedule)) return null;
  const first = schedule[0]!;
  return { arriveBy: first.arriveBy, leaveCampusAt: first.leaveCampusAt };
}

/** "Mon to Fri" where the selection is a run, otherwise a dotted list. */
export function describeDays(days: Weekday[]): string {
  if (days.length === 0) return "No days selected";
  if (days.length === 7) return "Every day";

  const indexes = days
    .map((d) => WEEKDAYS.indexOf(d))
    .sort((a, b) => a - b);
  const isRun = indexes.every(
    (value, i) => i === 0 || value === indexes[i - 1]! + 1,
  );

  if (isRun && indexes.length > 2) {
    return `${WEEKDAYS[indexes[0]!]} to ${WEEKDAYS[indexes[indexes.length - 1]!]}`;
  }
  return indexes.map((i) => WEEKDAYS[i]).join(" · ");
}

/**
 * One line for cards and summaries. Says "times vary" rather than picking an
 * arbitrary day's time, which would be actively misleading on a ride card.
 */
export function describeSchedule(schedule: DaySchedule[]): string {
  if (schedule.length === 0) return "No days set";

  const days = describeDays(daysOf(schedule));
  const shared = uniformTimes(schedule);

  if (!shared) return `${days} · times vary`;

  const parts = [days];
  if (shared.arriveBy) parts.push(`reach by ${shared.arriveBy}`);
  if (shared.leaveCampusAt) parts.push(`leave ${shared.leaveCampusAt}`);
  return parts.join(" · ");
}

/** Times for one day, for the per-day rows. */
export function describeDayTimes(entry: DaySchedule): string {
  if (!entry.arriveBy && !entry.leaveCampusAt) return "Not travelling";
  if (entry.arriveBy && entry.leaveCampusAt) {
    return `Reach by ${entry.arriveBy} · leaves ${entry.leaveCampusAt}`;
  }
  if (entry.arriveBy) return `Reach by ${entry.arriveBy} · no return`;
  return `Return only · leaves ${entry.leaveCampusAt}`;
}

/**
 * Compact form for narrow rows: "7:30 AM to 5:30 PM" rather than
 * "7:30 AM · back 5:30 PM", which wraps on a 375pt screen once a day badge
 * and a status tag are sharing the line.
 */
export function describeDayTimesCompact(entry: DaySchedule): string {
  if (!entry.arriveBy && !entry.leaveCampusAt) return "Not travelling";
  if (entry.arriveBy && entry.leaveCampusAt) {
    return `By ${entry.arriveBy} · out ${entry.leaveCampusAt}`;
  }
  return entry.arriveBy
    ? `By ${entry.arriveBy}`
    : `Leaves ${entry.leaveCampusAt}`;
}

/** The weekday token for a given date, matching the Weekday union. */
export function weekdayOf(date = new Date()): Weekday {
  // getDay() is 0-indexed from Sunday; WEEKDAYS starts at Monday.
  const index = (date.getDay() + 6) % 7;
  return WEEKDAYS[index]!;
}

export function scheduleForDay(
  schedule: DaySchedule[],
  day: Weekday,
): DaySchedule | undefined {
  return schedule.find((entry) => entry.day === day);
}

/** Today's entry, or undefined when the user does not travel today. */
export function todaysSchedule(schedule: DaySchedule[], date = new Date()) {
  return scheduleForDay(schedule, weekdayOf(date));
}

/** Applies one set of times to every selected day. */
export function applyToAll(
  days: Weekday[],
  arriveBy?: string,
  leaveCampusAt?: string,
): DaySchedule[] {
  return days.map((day) => ({ day, arriveBy, leaveCampusAt }));
}

/**
 * Keeps a schedule in step with the selected days: drops days that were
 * deselected, and seeds newly added days from the most common existing times
 * so the user is not forced to fill in every new day from scratch.
 */
export function syncScheduleToDays(
  schedule: DaySchedule[],
  days: Weekday[],
): DaySchedule[] {
  const existing = new Map(schedule.map((entry) => [entry.day, entry]));
  const template = schedule[0];

  return days.map(
    (day) =>
      existing.get(day) ?? {
        day,
        arriveBy: template?.arriveBy,
        leaveCampusAt: template?.leaveCampusAt,
      },
  );
}
