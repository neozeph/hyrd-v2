import { AppShell } from "../components/layout/app-shell";

type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <AppShell>
      <main className="min-w-0">
        <header className="border-b border-hyrd-border bg-white px-5 py-5 pl-18 sm:px-7 lg:pl-7">
          <h1 className="text-2xl font-semibold text-hyrd-text">{title}</h1>
          <p className="mt-1 text-sm text-hyrd-muted">
            This area is reserved for a focused future pass.
          </p>
        </header>
      </main>
    </AppShell>
  );
}
