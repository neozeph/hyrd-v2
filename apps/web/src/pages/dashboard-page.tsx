import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAuth } from "../auth/use-auth";
import { ApplicationDrawer } from "../components/applications/application-drawer";
import { ApplicationCard } from "../components/applications/application-card";
import { AppShell, PageHeader } from "../components/layout/app-shell";
import { SignatureButton } from "../components/public/signature-cta";
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
        className="grid gap-3 lg:grid-cols-[1.8fr_1fr]"
      >
        <div className="h-[224px] animate-pulse border border-hyrd-border bg-white" />
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div
              className="h-[66px] animate-pulse border border-hyrd-border bg-white"
              key={item}
            />
          ))}
        </div>
      </section>
      <section className="border border-hyrd-border bg-white p-4">
        <div className="h-5 w-40 animate-pulse bg-slate-100" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-[132px] animate-pulse bg-slate-100" key={item} />
          ))}
        </div>
      </section>
    </>
  );
}

export function DashboardPage() {
  const { isAuthenticated, logout, user } = useAuth();
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
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Welcome back, ${firstName}.` : "Welcome back.";

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
            <SignatureButton
              aria-label="Add application"
              className="min-h-10 px-4 py-2 text-xs"
              onClick={openCreateDrawer}
              title="Add application"
              type="button"
            >
              Add application
            </SignatureButton>
          }
          title={greeting}
        />

        <div className="space-y-5 px-4 py-4 sm:px-7 sm:py-5">
          {isLoading ? <DashboardSkeleton /> : null}

          {!isLoading && error !== null ? (
            <section className="border border-rose-200 bg-white p-6">
              <h2 className="text-base font-semibold text-hyrd-text">
                Applications could not load
              </h2>
              <p className="mt-2 text-sm text-hyrd-muted">
                {error instanceof Error ? error.message : "Please try again."}
              </p>
              <button
                className="mt-4 inline-flex h-10 items-center justify-center border border-hyrd-border px-4 text-sm font-semibold text-hyrd-text transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
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
                className="grid gap-3 lg:grid-cols-[1.8fr_1fr]"
              >
                <article className="grid min-h-[220px] place-items-center border-2 border-hyrd-navy bg-white px-6 py-8 text-center">
                  <p className="font-serif text-2xl font-semibold text-hyrd-navy">
                    Active Applications
                  </p>
                  <p className="mt-3 text-7xl font-semibold leading-none text-hyrd-navy sm:text-8xl">
                    {stats.active}
                  </p>
                  <p className="mt-3 text-sm text-hyrd-muted">Open pipeline</p>
                </article>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    ["Total applications", stats.total, "All roles"],
                    ["Interviews", stats.interviews, "In progress"],
                    ["Offers", stats.offers, "Decision stage"],
                  ].map(([label, value, detail]) => (
                    <article
                      className="border border-hyrd-border bg-white px-4 py-4 text-center"
                      key={label}
                    >
                      <p className="font-serif text-base font-semibold text-hyrd-navy">
                        {label}
                      </p>
                      <p className="mt-1 text-3xl font-semibold text-hyrd-text">
                        {value}
                      </p>
                      <p className="mt-1 text-xs text-hyrd-muted">{detail}</p>
                    </article>
                  ))}
                </div>
              </section>

              {stats.total === 0 ? (
                <section className="border border-hyrd-border bg-white p-8 text-center">
                  <h2 className="text-base font-semibold text-hyrd-text">
                    No applications yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-hyrd-muted">
                    Once applications are added, your dashboard will show real
                    totals and recent activity here.
                  </p>
                  <button
                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 bg-hyrd-gold px-4 text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55]"
                    onClick={openCreateDrawer}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="plus" />
                    Add application
                  </button>
                </section>
              ) : (
                <section className="border border-hyrd-border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-hyrd-navy">
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
