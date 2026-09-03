import { useMemo, useState } from "react";

import { PipelineView } from "../components/applications/pipeline-view";
import { TableView } from "../components/applications/table-view";
import { AppShell } from "../components/layout/app-shell";
import { Icon } from "../components/ui/icons";
import {
  activeStatuses,
  closedStatuses,
  mockApplications,
  statusLabels,
} from "../data/applications";
import type { ApplicationStatus } from "../types/application";

type ViewMode = "pipeline" | "table";
type SortMode = "updated-desc" | "applied-desc" | "company-asc";
type PipelineTab = "all" | "closed" | ApplicationStatus;

const pipelineTabs: PipelineTab[] = ["all", ...activeStatuses, "closed"];

function toTime(date: string | null) {
  return date ? new Date(`${date}T00:00:00`).getTime() : 0;
}

function tabLabel(tab: PipelineTab) {
  if (tab === "all") return "All";
  if (tab === "closed") return "Closed";
  return statusLabels[tab];
}

function matchesTab(status: ApplicationStatus, tab: PipelineTab) {
  if (tab === "all") return true;
  if (tab === "closed") return closedStatuses.includes(status);
  return status === tab;
}

export function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PipelineTab>("all");
  const [sortMode, setSortMode] = useState<SortMode>("updated-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("pipeline");

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return mockApplications
      .filter((application) => {
        const matchesQuery =
          !normalizedQuery ||
          [application.position, application.company, application.location].some(
            (value) => value.toLowerCase().includes(normalizedQuery),
          );
        return matchesQuery && matchesTab(application.status, activeTab);
      })
      .sort((a, b) => {
        if (sortMode === "company-asc") return a.company.localeCompare(b.company);
        if (sortMode === "applied-desc") {
          return toTime(b.appliedDate) - toTime(a.appliedDate);
        }
        return toTime(b.lastUpdated) - toTime(a.lastUpdated);
      });
  }, [activeTab, query, sortMode]);

  const hasFilters = query.trim() || activeTab !== "all";
  const showStatus = activeTab === "all" || activeTab === "closed";

  return (
    <AppShell>
      <main className="min-w-0">
        <header className="border-b border-hyrd-border bg-white px-5 py-5 pl-18 sm:px-7 lg:pl-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-hyrd-text">
                Applications
              </h1>
              <p className="mt-1 text-sm text-hyrd-muted">
                Search, sort, and review the status of every tracked role.
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
          <section className="rounded-[14px] border border-hyrd-border bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="relative min-w-0 flex-1 lg:max-w-md">
                <span className="sr-only">Search applications</span>
                <Icon
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hyrd-muted"
                  name="search"
                />
                <input
                  className="h-10 w-full rounded-[10px] border border-hyrd-border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-hyrd-gold focus:ring-3 focus:ring-[#b28a4a33]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search role, company, location"
                  value={query}
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label="Sort applications"
                  className="h-10 rounded-[10px] border border-hyrd-border bg-white px-3 text-sm outline-none focus:border-hyrd-gold focus:ring-3 focus:ring-[#b28a4a33]"
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  value={sortMode}
                >
                  <option value="updated-desc">Recently updated</option>
                  <option value="applied-desc">Recently applied</option>
                  <option value="company-asc">Company A-Z</option>
                </select>
                <div className="inline-flex rounded-[10px] border border-hyrd-border bg-[#f9fafb] p-1">
                  {(["pipeline", "table"] as ViewMode[]).map((mode) => (
                    <button
                      aria-pressed={viewMode === mode}
                      className={`inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-hyrd-gold ${
                        viewMode === mode
                          ? "bg-white text-hyrd-text shadow-sm"
                          : "text-hyrd-muted hover:text-hyrd-text"
                      }`}
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      type="button"
                    >
                      <Icon className="h-4 w-4" name={mode} />
                      {mode === "pipeline" ? "Pipeline" : "Table"}
                    </button>
                  ))}
                </div>
                {hasFilters ? (
                  <button
                    className="h-10 rounded-[10px] border border-hyrd-border px-3 text-sm font-medium text-hyrd-text transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                    onClick={() => {
                      setQuery("");
                      setActiveTab("all");
                    }}
                    type="button"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <div className="h-11 overflow-x-auto overflow-y-hidden border-b border-hyrd-border">
              <div
                aria-label="Pipeline stages"
                className="flex h-11 min-w-max flex-nowrap"
                role="tablist"
              >
                {pipelineTabs.map((tab) => {
                  const count = mockApplications.filter((application) =>
                    matchesTab(application.status, tab),
                  ).length;
                  const isActive = activeTab === tab;
                  return (
                    <button
                      aria-selected={isActive}
                      className={`h-11 shrink-0 whitespace-nowrap border border-b-0 px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-hyrd-gold ${
                        isActive
                          ? "rounded-t-[10px] border-hyrd-border bg-[#f9fafb] text-hyrd-text"
                          : "border-transparent text-hyrd-muted hover:bg-white hover:text-hyrd-text"
                      }`}
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      role="tab"
                      type="button"
                    >
                      {tabLabel(tab)}
                      <span className="ml-2 text-xs text-hyrd-muted">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {viewMode === "pipeline" ? (
              <PipelineView
                applications={filteredApplications}
                showStatus={showStatus}
              />
            ) : (
              <TableView applications={filteredApplications} />
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
