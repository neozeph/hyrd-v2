import type { JobApplication } from "../../types/application";
import { formatShortApplicationDate } from "../../lib/application-dates";
import { activeStatuses } from "../../data/applications";
import { StatusLabel } from "./status-label";

type ApplicationCardProps = {
  application: JobApplication;
  onOpen?: (applicationId: string) => void;
  showStatus?: boolean;
};

export function ApplicationCard({
  application,
  onOpen,
  showStatus = false,
}: ApplicationCardProps) {
  const datePrefix =
    application.status === "saved" && application.appliedAt === undefined
      ? "Updated"
      : "Applied";
  const displayDate =
    application.status === "saved" && application.appliedAt === undefined
      ? application.updatedAt
      : application.appliedAt;
  const isActive = activeStatuses.includes(application.status);

  return (
    <article
      className={`flex h-full min-h-[172px] flex-col border bg-white p-4 transition hover:-translate-y-0.5 hover:border-hyrd-navy focus-within:ring-2 focus-within:ring-hyrd-gold ${
        isActive ? "border-hyrd-navy" : "border-hyrd-border"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="break-words text-xl font-bold uppercase leading-tight text-hyrd-navy">
            {application.position}
          </h3>
          {showStatus ? <StatusLabel status={application.status} /> : null}
        </div>
        <p className="mt-3 break-words font-serif text-base font-light leading-tight text-hyrd-text">
          {application.company}
        </p>
        <p className="mt-1 break-words font-serif text-sm font-light text-hyrd-muted">
          {application.location ?? "Location not set"}
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3 pt-5 text-xs uppercase tracking-[0.08em] text-hyrd-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0">
          {datePrefix} {formatShortApplicationDate(displayDate, "Not applied yet")}
        </span>
        {onOpen ? (
          <button
            className="inline-flex min-h-9 shrink-0 items-center justify-center bg-hyrd-navy px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-hyrd-deep focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
            onClick={() => onOpen(application.id)}
            type="button"
          >
            View Details
          </button>
        ) : null}
      </div>
    </article>
  );
}
