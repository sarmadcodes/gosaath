/**
 * Product flags.
 *
 * WOMEN_ONLY — off, deliberately.
 *
 * The preference exists end to end: the field is on the commute, the matching
 * engine honours it, and the API accepts it. What does not exist is any way to
 * know that somebody ticking it is a woman. GoSaath stores no gender and
 * verifies none, so "women only" currently means "matches other people who
 * also ticked this box", which a man can do.
 *
 * A badge that says "Women only" is read as a guarantee. Showing one the
 * system cannot enforce is worse than not offering the option at all: it
 * invites exactly the person it claims to protect to relax their own caution
 * on the strength of a check nobody performed.
 *
 * So the controls are hidden rather than the feature deleted. Turning this to
 * true restores every screen, and should happen only once gender is
 * established at signup or verified with the student card that already goes
 * through admin review.
 */
export const WOMEN_ONLY_ENABLED = false;
