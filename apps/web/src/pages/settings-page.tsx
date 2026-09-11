import { useAuth } from "../auth/use-auth";
import { AppShell, PageHeader } from "../components/layout/app-shell";
import { formatApplicationDate } from "../lib/application-dates";

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-hyrd-muted">
        {label}
      </dt>
      <dd className="mt-2 border border-hyrd-border bg-[#fbfaf6] px-3 py-2.5 text-sm text-hyrd-text">
        {value}
      </dd>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const displayName = user?.name?.trim() || "Not provided";
  const email = user?.email ?? "Not available";
  const createdAt = user?.createdAt
    ? formatApplicationDate(user.createdAt)
    : "Not available";

  return (
    <AppShell>
      <main className="min-w-0">
        <PageHeader title="Settings" />
        <div className="px-4 py-4 sm:px-7 sm:py-5">
          <section className="max-w-3xl border border-hyrd-border bg-white p-5">
            <div className="border-b border-hyrd-border pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-hyrd-gold-dark">
                Profile settings
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-hyrd-navy">
                Account profile
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-hyrd-muted">
                These values come from your HYRD account. This repository does not
                currently expose a profile update endpoint, so profile fields are
                shown as read-only.
              </p>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Name" value={displayName} />
              <ReadOnlyField label="Email" value={email} />
              <ReadOnlyField label="Account created" value={createdAt} />
            </dl>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
