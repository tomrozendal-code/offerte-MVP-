import { DemoBanner } from "@/components/DemoBanner";
import { Page } from "@/components/ui/Page";
import { isDemoMode } from "@/lib/ai/providers";
import { NewQuote } from "./NewQuote";

export default function NewQuotePage() {
  return (
    <Page title="Nieuwe offerte">
      {isDemoMode() && <DemoBanner />}
      <NewQuote />
    </Page>
  );
}
