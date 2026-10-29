import { Page } from "@/components/ui/Page";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const { fout } = await searchParams;
  return (
    <Page title="Inloggen">
      <p className="text-body -mt-4 px-1 text-label-2">Spreek de klus in, controleer, verstuur.</p>
      <LoginForm linkError={fout === "link"} />
    </Page>
  );
}
