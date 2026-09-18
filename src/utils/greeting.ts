/**
 * Commuting is a morning-and-evening activity, so the greeting tracks the two
 * moments the app is actually opened rather than being decorative.
 */
export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** First name only. Full names get long and push the greeting onto two lines. */
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
