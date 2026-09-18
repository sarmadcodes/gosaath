import { LegalScreen } from "@/screens/legal";
import { TERMS } from "@/data/legal";

export default function TermsRoute() {
  return <LegalScreen document={TERMS} />;
}
