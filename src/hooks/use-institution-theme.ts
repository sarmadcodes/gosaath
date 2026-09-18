import { useEffect } from "react";
import { api } from "@/services";
import { institutionById } from "@/data/institutions";
import { useTheme } from "@/theme";

/**
 * Applies the signed-in user's institution accent app-wide.
 *
 * The launch route also does this, but it is not sufficient on its own: a deep
 * link (a push notification, or a URL on web) mounts a screen without passing
 * through the launch gate, and the app would render in the default accent
 * instead of the user's campus colour. Running it once at the root makes the
 * theme a property of the session rather than of the route taken to get there.
 */
export function useInstitutionTheme() {
  const { setBrandColor } = useTheme();

  useEffect(() => {
    let cancelled = false;

    api.auth
      .restore()
      .then((session) => {
        if (cancelled || !session) return;
        const institution = institutionById(session.user.institutionId);
        if (institution) setBrandColor(institution.brandColor);
      })
      .catch(() => {
        // The accent is cosmetic: a failure here must never block the app.
      });

    return () => {
      cancelled = true;
    };
  }, [setBrandColor]);
}
