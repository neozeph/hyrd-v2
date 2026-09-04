import { AppShell, PageHeader } from "../components/layout/app-shell";

type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <AppShell>
      <main className="min-w-0">
        <PageHeader title={title} />
      </main>
    </AppShell>
  );
}
