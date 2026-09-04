import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAuth } from "../auth/use-auth";
import { ApplicationDrawer } from "../components/applications/application-drawer";
import { ApplicationCard } from "../components/applications/application-card";
import { AppShell, PageHeader } from "../components/layout/app-shell";
import { Icon } from "../components/ui/icons";
import {
  useApplicationStatsQuery,
  useRecentApplicationsQuery,
} from "../lib/application-queries";
import { ApiError } from "../lib/api-error";

function DashboardSkeleton() {
  return (
    <>
      <section
        aria-label="Loading application summary"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {[0, 1, 2, 3].map((item) => (
          <div
            className="h-[112px] animate-pulse rounded-[12px] border border-hyrd-border bg-white"
            key={item}
          />
        ))}
      </section>
      <section className="rounded-[14px] border border-hyrd-border bg-white p-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-[132px] animate-pulse rounded-[12px] bg-slate-100" key={item} />
          ))}
        </div>
      </section>
    </>
  );
}

export function DashboardPage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerMode, setDrawerMode] = useState<"create" | "view">("view");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const statsQuery = useApplicationStatsQuery(isAuthenticated);
  const recentQuery = useRecentApplicationsQuery(isAuthenticated);

  const authError =
    statsQuery.error instanceof ApiError && statsQuery.error.status === 401
      ? statsQuery.error
      : recentQuery.error instanceof ApiError && recentQuery.error.status === 401
        ? recentQuery.error
        : null;

  useEffect(() => {
    if (authError === null) return;

    void logout().finally(() => {
      navigate("/login", { replace: true });
    });
  }, [authError, logout, navigate]);

  const isLoading = statsQuery.isLoading || recentQuery.isLoading;
  const error = statsQuery.error ?? recentQuery.error;
  const stats = statsQuery.data;
  const recentApplications = recentQuery.data?.data ?? [];

  function openCreateDrawer() {
    setDrawerMode("create");
    setSelectedApplicationId(null);
    setIsDrawerOpen(true);
  }

  function openDetailDrawer(applicationId: string) {
    setDrawerMode("view");
    setSelectedApplicationId(applicationId);
    setIsDrawerOpen(true);
  }

  function handleExpiredSession() {
    void logout().finally(() => {
      navigate("/login", { replace: true });
    });
  }

  return (
    <AppShell>
      <main className="min-w-0">
        <PageHeader
          action={
            <button
              aria-label="Add application"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-hyrd-gold text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55] sm:w-auto sm:gap-2 sm:px-4"
              onClick={openCreateDrawer}
              title="Add application"
              type="button"
            >
              <Icon className="h-4 w-4" name="plus" />
              <span className="sr-only sm:not-sr-only">Add application</span>
            </button>
          }
          title="Overview"
        />

        <div className="space-y-5 px-4 py-4 sm:px-7 sm:py-5">
          {isLoading ? <DashboardSkeleton /> : null}

          {!isLoading && error !== null ? (
            <section className="rounded-[14px] border border-rose-200 bg-white p-6">
              <h2 className="text-base font-semibold text-hyrd-text">
                Applications could not load
              </h2>
              <p className="mt-2 text-sm text-hyrd-muted">
                {error instanceof Error ? error.message : "Please try again."}
              </p>
              <button
                className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] border border-hyrd-border px-4 text-sm font-semibold text-hyrd-text transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                onClick={() => {
                  void statsQuery.refetch();
                  void recentQuery.refetch();
                }}
                type="button"
              >
                Retry
              </button>
            </section>
          ) : null}

          {!isLoading && error === null && stats !== undefined ? (
            <>
              <section
                aria-label="Application summary"
                className="grid grid-cols-2 gap-3 xl:grid-cols-4"
              >
                {[
                  ["Total applications", stats.total, "All roles"],
                  ["Active applications", stats.active, "Open pipeline"],
                  ["Interviews", stats.interviews, "In progress"],
                  ["Offers", stats.offers, "Decision stage"],
                ].map(([label, value, detail]) => (
                  <article
                    className="rounded-[12px] border border-hyrd-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                    key={label}
                  >
                    <p className="min-h-10 text-sm text-hyrd-muted sm:min-h-0">
                      {label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-hyrd-text">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-hyrd-muted">{detail}</p>
                  </article>
                ))}
              </section>

              {stats.total === 0 ? (
                <section className="rounded-[14px] border border-hyrd-border bg-white p-8 text-center">
                  <h2 className="text-base font-semibold text-hyrd-text">
                    No applications yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-hyrd-muted">
                    Once applications are added, your dashboard will show real
                    totals and recent activity here.
                  </p>
                  <button
                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-hyrd-gold px-4 text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55]"
                    onClick={openCreateDrawer}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="plus" />
                    Add application
                  </button>
                </section>
              ) : (
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
                        onOpen={openDetailDrawer}
                        showStatus
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
        {isDrawerOpen ? (
          <ApplicationDrawer
            applicationId={selectedApplicationId}
            initialMode={drawerMode}
            isOpen={isDrawerOpen}
            key={`${drawerMode}-${selectedApplicationId ?? "new"}`}
            onClose={() => setIsDrawerOpen(false)}
            onExpiredSession={handleExpiredSession}
          />
        ) : null}
      </main>
    </AppShell>
  );
}
