import type { JobApplication } from "../../types/application";
import { formatShortApplicationDate } from "../../lib/application-dates";
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

  return (
    <article className="min-h-[132px] rounded-[12px] border border-hyrd-border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(16,24,40,0.07)] focus-within:ring-2 focus-within:ring-hyrd-gold">
      <div className="flex items-start justify-between gap-3">
        <h3 className="break-words text-sm font-semibold leading-5 text-hyrd-text">
          {application.position}
        </h3>
        {showStatus ? <StatusLabel status={application.status} /> : null}
      </div>
      <p className="mt-2 break-words text-sm text-hyrd-muted">
        {application.company}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-hyrd-muted">
        <span>{application.location ?? "Location not set"}</span>
        <span>
          {datePrefix} {formatShortApplicationDate(displayDate, "Not applied yet")}
        </span>
      </div>
      {onOpen ? (
        <button
          className="mt-4 text-sm font-semibold text-hyrd-gold-dark underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
          onClick={() => onOpen(application.id)}
          type="button"
        >
          View details
        </button>
      ) : null}
    </article>
  );
}
