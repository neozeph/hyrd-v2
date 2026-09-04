import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../auth/use-auth";
import { ApplicationDrawer } from "../components/applications/application-drawer";
import { PipelineView } from "../components/applications/pipeline-view";
import { TableView } from "../components/applications/table-view";
import { AppShell, PageHeader } from "../components/layout/app-shell";
import { Icon } from "../components/ui/icons";
import {
  activeStatuses,
  closedStatuses,
  statusLabels,
} from "../data/applications";
import { ApiError } from "../lib/api-error";
import type {
  ApplicationListParams,
  ApplicationSortBy,
} from "../lib/application-api";
import {
  useApplicationListQuery,
  useApplicationStatsQuery,
} from "../lib/application-queries";
import { useDebouncedValue } from "../lib/use-debounced-value";
import type { ApplicationStatus } from "../types/application";

type ViewMode = "pipeline" | "table";
type SortMode = "updated-desc" | "applied-desc" | "company-asc";
type PipelineTab = "all" | "closed" | ApplicationStatus;

const pipelineTabs: PipelineTab[] = ["all", ...activeStatuses, "closed"];
const pageSize = 6;
const compactControlClass =
  "h-10 rounded-[10px] border border-hyrd-border bg-white text-sm outline-none transition hover:border-slate-300 focus:border-hyrd-gold focus:ring-3 focus:ring-[#b28a4a33] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-hyrd-muted";

function tabLabel(tab: PipelineTab) {
  if (tab === "all") return "All";
  if (tab === "closed") return "Closed";
  return statusLabels[tab];
}

function sortParams(sortMode: SortMode): {
  sortBy: ApplicationSortBy;
  sortOrder: "asc" | "desc";
} {
  if (sortMode === "company-asc") {
    return {
      sortBy: "company",
      sortOrder: "asc",
    };
  }

  if (sortMode === "applied-desc") {
    return {
      sortBy: "appliedAt",
      sortOrder: "desc",
    };
  }

  return {
    sortBy: "updatedAt",
    sortOrder: "desc",
  };
}

function statusParam(tab: PipelineTab): ApplicationListParams["status"] {
  if (tab === "all") return undefined;
  if (tab === "closed") return closedStatuses;
  return tab;
}

function tabCount(tab: PipelineTab, counts?: Record<ApplicationStatus, number>) {
  if (counts === undefined) return "0";
  if (tab === "all") {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }
  if (tab === "closed") return counts.rejected + counts.withdrawn;
  return counts[tab];
}

function ApplicationsSkeleton() {
  return (
    <section
      aria-label="Loading applications"
      className="rounded-b-[14px] rounded-tr-[14px] border border-hyrd-border bg-[#f9fafb] p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            className="h-[132px] animate-pulse rounded-[12px] bg-white"
            key={item}
          />
        ))}
      </div>
    </section>
  );
}

export function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PipelineTab>("all");
  const [sortMode, setSortMode] = useState<SortMode>("updated-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("pipeline");
  const [page, setPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState<"create" | "view">("view");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const listParams = useMemo<ApplicationListParams>(
    () => ({
      ...sortParams(sortMode),
      limit: pageSize,
      page,
      search: debouncedQuery.trim() || undefined,
      status: statusParam(activeTab),
    }),
    [activeTab, debouncedQuery, page, sortMode],
  );

  const applicationsQuery = useApplicationListQuery(listParams, isAuthenticated);
  const statsQuery = useApplicationStatsQuery(isAuthenticated);
  const authError =
    applicationsQuery.error instanceof ApiError &&
    applicationsQuery.error.status === 401
      ? applicationsQuery.error
      : statsQuery.error instanceof ApiError && statsQuery.error.status === 401
        ? statsQuery.error
        : null;

  useEffect(() => {
    if (authError === null) return;

    void logout().finally(() => {
      navigate("/login", { replace: true });
    });
  }, [authError, logout, navigate]);

  const applications = applicationsQuery.data?.data ?? [];
  const pagination = applicationsQuery.data?.pagination;
  const hasFilters = Boolean(query.trim()) || activeTab !== "all";
  const showStatus = activeTab === "all" || activeTab === "closed";
  const total = pagination?.total ?? 0;
  const startResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endResult = Math.min(page * pageSize, total);
  const isInitialLoading =
    applicationsQuery.isLoading && applicationsQuery.data === undefined;
  const error = applicationsQuery.error ?? statsQuery.error;

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
          title="Applications"
        />

        <div className="space-y-5 px-4 py-4 sm:px-7 sm:py-5">
          <section className="rounded-[14px] border border-hyrd-border bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              <label className="relative min-w-0">
                <span className="sr-only">Search applications</span>
                <Icon
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hyrd-muted"
                  name="search"
                />
                <input
                  className={`${compactControlClass} h-9 w-full pl-9 pr-3 sm:h-10`}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search role, company, location"
                  value={query}
                />
              </label>

              <div className="flex min-w-0 items-center gap-2">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Sort applications</span>
                  <select
                    aria-label="Sort applications"
                    className={`${compactControlClass} w-full appearance-none truncate px-3 pr-8`}
                    onChange={(event) => {
                      setSortMode(event.target.value as SortMode);
                      setPage(1);
                    }}
                    value={sortMode}
                  >
                    <option value="updated-desc">Recently updated</option>
                    <option value="applied-desc">Recently applied</option>
                    <option value="company-asc">Company A-Z</option>
                  </select>
                  <Icon
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 -rotate-90 text-hyrd-muted"
                    name="chevron"
                  />
                </label>
                <div className="inline-flex shrink-0 rounded-[10px] border border-hyrd-border bg-[#f9fafb] p-1">
                  {(["pipeline", "table"] as ViewMode[]).map((mode) => (
                    <button
                      aria-pressed={viewMode === mode}
                      aria-label={mode === "pipeline" ? "Pipeline view" : "Table view"}
                      className={`inline-flex h-8 w-9 items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-hyrd-gold sm:w-auto sm:gap-2 sm:px-3 ${
                        viewMode === mode
                          ? "bg-white text-hyrd-text shadow-sm"
                          : "text-hyrd-muted hover:text-hyrd-text"
                      }`}
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      type="button"
                    >
                      <Icon className="h-4 w-4" name={mode} />
                      <span className="sr-only sm:not-sr-only">
                        {mode === "pipeline" ? "Pipeline" : "Table"}
                      </span>
                    </button>
                  ))}
                </div>
                {hasFilters ? (
                  <button
                    aria-label="Clear filters"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-hyrd-border text-sm font-medium text-hyrd-text transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-hyrd-gold sm:w-auto sm:px-3"
                    onClick={() => {
                      setQuery("");
                      setActiveTab("all");
                      setPage(1);
                    }}
                    title="Clear filters"
                    type="button"
                  >
                    <Icon className="h-4 w-4 sm:hidden" name="close" />
                    <span className="sr-only sm:not-sr-only">Clear filters</span>
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <div className="overflow-hidden border-b border-hyrd-border sm:h-11 sm:overflow-x-auto sm:overflow-y-hidden">
              <div
                aria-label="Pipeline stages"
                className="grid grid-cols-4 gap-1 sm:flex sm:h-11 sm:min-w-max sm:flex-nowrap sm:gap-0"
                role="tablist"
              >
                {pipelineTabs.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      aria-selected={isActive}
                      className={`min-h-11 shrink-0 overflow-hidden border px-1.5 text-[12px] font-medium leading-tight transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-hyrd-gold sm:h-11 sm:whitespace-nowrap sm:border-b-0 sm:px-4 sm:text-sm ${
                        isActive
                          ? "border-hyrd-border bg-[#f9fafb] text-hyrd-text sm:rounded-t-[10px]"
                          : "border-transparent text-hyrd-muted hover:bg-white hover:text-hyrd-text"
                      }`}
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setPage(1);
                      }}
                      role="tab"
                      type="button"
                    >
                      {tabLabel(tab)}
                      <span className="ml-1 text-[10px] text-hyrd-muted sm:ml-2 sm:text-xs">
                        {tabCount(tab, statsQuery.data?.countsByStatus)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isInitialLoading ? <ApplicationsSkeleton /> : null}

            {!isInitialLoading && error !== null ? (
              <section className="rounded-b-[14px] rounded-tr-[14px] border border-rose-200 bg-white p-8 text-center">
                <h2 className="text-base font-semibold text-hyrd-text">
                  Applications could not load
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-hyrd-muted">
                  {error instanceof Error ? error.message : "Please try again."}
                </p>
                <button
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] border border-hyrd-border px-4 text-sm font-semibold text-hyrd-text transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                  onClick={() => {
                    void applicationsQuery.refetch();
                    void statsQuery.refetch();
                  }}
                  type="button"
                >
                  Retry
                </button>
              </section>
            ) : null}

            {!isInitialLoading && error === null && total === 0 ? (
              <section className="rounded-b-[14px] rounded-tr-[14px] border border-hyrd-border bg-white p-8 text-center">
                <h2 className="text-base font-semibold text-hyrd-text">
                  {hasFilters ? "No applications match" : "No applications yet"}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-hyrd-muted">
                  {hasFilters
                    ? "Try a different search or status filter."
                    : "Applications have not been added to this account yet."}
                </p>
                {hasFilters ? (
                  <button
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] border border-hyrd-border px-4 text-sm font-semibold text-hyrd-text transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                    onClick={() => {
                      setQuery("");
                      setActiveTab("all");
                      setPage(1);
                    }}
                    type="button"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-hyrd-gold px-4 text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55]"
                    onClick={openCreateDrawer}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="plus" />
                    Add application
                  </button>
                )}
              </section>
            ) : null}

            {!isInitialLoading && error === null && total > 0 ? (
              <>
                {viewMode === "pipeline" ? (
                  <PipelineView
                    applications={applications}
                    onOpen={openDetailDrawer}
                    showStatus={showStatus}
                  />
                ) : (
                  <TableView applications={applications} onOpen={openDetailDrawer} />
                )}
                <div className="flex flex-col gap-3 border-t border-hyrd-border bg-white px-4 py-3 text-sm text-hyrd-muted sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Showing {startResult}-{endResult} of {total}
                    {applicationsQuery.isFetching ? " - refreshing" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="h-9 rounded-[10px] border border-hyrd-border px-3 font-medium text-hyrd-text transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((currentPage) => Math.max(1, currentPage - 1))
                      }
                      type="button"
                    >
                      Previous
                    </button>
                    <button
                      className="h-9 rounded-[10px] border border-hyrd-border px-3 font-medium text-hyrd-text transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={pagination === undefined || page >= pagination.totalPages}
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </section>
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
