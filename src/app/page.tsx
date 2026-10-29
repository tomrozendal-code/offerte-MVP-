import { ButtonLink } from "@/components/ui/Button";
import { DocIcon, PlusIcon } from "@/components/ui/Icons";
import { Page } from "@/components/ui/Page";
import { Disclaimer } from "@/components/Disclaimer";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import Link from "next/link";

export default function QuotesPage() {
  return (
    <Page
      title="Offertes"
      action={
        <Link href="/nieuw" aria-label="Nieuwe offerte" className="flex size-11 items-center justify-center rounded-full text-tint active:opacity-60">
          <PlusIcon className="size-6" />
        </Link>
      }
    >
      {!isSupabaseConfigured() && (
        <div className="text-subhead rounded-card border-l-[3px] border-orange bg-orange/10 px-4 py-3 text-label">
          <strong className="font-semibold">Database nog niet gekoppeld.</strong> De app werkt, maar slaat nog niets op. Zie de README.
        </div>
      )}

      <section className="flex flex-col items-center rounded-card border border-separator bg-surface px-6 py-12 text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-card bg-tint-soft text-tint">
          <DocIcon className="size-8" />
        </span>
        <h2 className="text-title-2">Nog geen offertes</h2>
        <p className="text-body mt-2 max-w-xs text-label-2">Spreek de klus in, controleer, verstuur. Je offerte is in een paar minuten klaar.</p>
        <ButtonLink href="/nieuw" className="mt-8 max-w-xs">
          <PlusIcon />
          Nieuwe offerte
        </ButtonLink>
      </section>

      <Disclaimer />
    </Page>
  );
}
