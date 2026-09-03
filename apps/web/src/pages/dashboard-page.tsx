import { Link } from "react-router";

import { ApplicationCard } from "../components/applications/application-card";
import { AppShell } from "../components/layout/app-shell";
import { Icon } from "../components/ui/icons";
import { closedStatuses, mockApplications } from "../data/applications";

function toTime(date: string | null) {
  return date ? new Date(`${date}T00:00:00`).getTime() : 0;
}

export function DashboardPage() {
  const total = mockApplications.length;
  const active = mockApplications.filter(
    (application) => !closedStatuses.includes(application.status),
  ).length;
  const interviews = mockApplications.filter(
    (application) => application.status === "interview",
  ).length;
  const offers = mockApplications.filter(
    (application) => application.status === "offer",
  ).length;
  const recentApplications = [...mockApplications]
    .sort((a, b) => toTime(b.lastUpdated) - toTime(a.lastUpdated))
    .slice(0, 4);

  return (
    <AppShell>
      <main className="min-w-0">
        <header className="border-b border-hyrd-border bg-white px-5 py-5 pl-18 sm:px-7 lg:pl-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-hyrd-text">Overview</h1>
              <p className="mt-1 text-sm text-hyrd-muted">
                Track your applications and upcoming opportunities.
              </p>
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-hyrd-gold px-4 text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55]"
              type="button"
            >
              <Icon className="h-4 w-4" name="plus" />
              Add application
            </button>
          </div>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-7">
          <section
            aria-label="Application summary"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {[
              ["Total applications", total, "All roles"],
              ["Active applications", active, "Open pipeline"],
              ["Interviews", interviews, "In progress"],
              ["Offers", offers, "Decision stage"],
            ].map(([label, value, detail]) => (
              <article
                className="rounded-[12px] border border-hyrd-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                key={label}
              >
                <p className="text-sm text-hyrd-muted">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-hyrd-text">
                  {value}
                </p>
                <p className="mt-1 text-xs text-hyrd-muted">{detail}</p>
              </article>
            ))}
          </section>

          <section className="rounded-[14px] border border-hyrd-border bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-hyrd-text">
                  Recent applications
                </h2>
                <p className="mt-1 text-sm text-hyrd-muted">
                  Recently updated records from your pipeline.
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-hyrd-gold-dark underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                to="/applications"
              >
                View all applications
              </Link>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {recentApplications.map((application) => (
                <ApplicationCard
                  application={application}
                  key={application.id}
                  showStatus
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
