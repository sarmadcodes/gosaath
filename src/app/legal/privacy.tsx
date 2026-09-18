import { LegalScreen } from "@/screens/legal";
import { PRIVACY } from "@/data/legal";

export default function PrivacyRoute() {
  return <LegalScreen document={PRIVACY} />;
}
