import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  CommuteIntent,
  DaySchedule,
  InstitutionType,
  UserType,
} from "@/data/types";

/**
 * Registration spans several screens, so the partially-filled account lives
 * here rather than being threaded through navigation params. Nothing is sent
 * to the service until the user submits the register step.
 */
export type SignupDraft = {
  userType?: UserType;
  institutionType?: InstitutionType;
  institutionId?: string;
  campusId?: string;

  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  photoUrl?: string | null;
  areaId?: string;

  intent?: CommuteIntent;
  schedule?: DaySchedule[];
};

type SignupContextValue = {
  draft: SignupDraft;
  update: (patch: Partial<SignupDraft>) => void;
  reset: () => void;
};

const SignupContext = createContext<SignupContextValue | null>(null);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<SignupDraft>({});

  const update = useCallback((patch: Partial<SignupDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => setDraft({}), []);

  const value = useMemo(
    () => ({ draft, update, reset }),
    [draft, update, reset],
  );

  return (
    <SignupContext.Provider value={value}>{children}</SignupContext.Provider>
  );
}

export function useSignup() {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error("useSignup must be used inside SignupProvider");
  }
  return context;
}
