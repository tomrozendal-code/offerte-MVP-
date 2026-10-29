import { MicIcon } from "@/components/ui/Icons";
import { Page } from "@/components/ui/Page";

export default function NewQuotePage() {
  return (
    <Page title="Nieuwe offerte">
      <section className="flex flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center">
        <span className="mb-6 flex size-24 items-center justify-center rounded-full bg-red text-white shadow-lg shadow-red/30">
          <MicIcon className="size-10" />
        </span>
        <h2 className="text-title-2">Spreek de klus in</h2>
        <p className="text-body mt-2 max-w-xs text-label-2">Inspreken en typen komen in fase 3. Eerst bouwen we de rekenmodule en de instellingen.</p>
      </section>
    </Page>
  );
}
