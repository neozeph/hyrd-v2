import type { JobApplication } from "../../types/application";
import { StatusLabel } from "./status-label";

function formatDate(date: string | null) {
  if (!date) return "Not applied yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

type ApplicationCardProps = {
  application: JobApplication;
  showStatus?: boolean;
};

export function ApplicationCard({
  application,
  showStatus = false,
}: ApplicationCardProps) {
  const datePrefix =
    application.status === "saved" && !application.appliedDate ? "Updated" : "Applied";
  const displayDate =
    application.status === "saved" && !application.appliedDate
      ? application.lastUpdated
      : application.appliedDate;

  return (
    <article className="min-h-[132px] rounded-[12px] border border-hyrd-border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(16,24,40,0.07)] focus-within:ring-2 focus-within:ring-hyrd-gold">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-5 text-hyrd-text">
          {application.position}
        </h3>
        {showStatus ? <StatusLabel status={application.status} /> : null}
      </div>
      <p className="mt-2 text-sm text-hyrd-muted">{application.company}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-hyrd-muted">
        <span>{application.location}</span>
        <span>
          {datePrefix} {formatDate(displayDate)}
        </span>
      </div>
    </article>
  );
}
