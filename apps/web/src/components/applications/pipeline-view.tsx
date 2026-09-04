import { ApplicationCard } from "./application-card";
import type { JobApplication } from "../../types/application";

type PipelineViewProps = {
  applications: JobApplication[];
  onOpen?: (applicationId: string) => void;
  showStatus?: boolean;
};

export function PipelineView({
  applications,
  onOpen,
  showStatus = false,
}: PipelineViewProps) {
  if (!applications.length) {
    return (
      <section className="rounded-b-[14px] rounded-tr-[14px] border border-hyrd-border bg-white p-8 text-center text-sm text-hyrd-muted">
        No applications match the current filters.
      </section>
    );
  }

  return (
    <section
      aria-label="Application pipeline cards"
      className="rounded-b-[14px] rounded-tr-[14px] border border-hyrd-border bg-[#f9fafb] p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {applications.map((application) => (
          <ApplicationCard
            application={application}
            key={application.id}
            onOpen={onOpen}
            showStatus={showStatus}
          />
        ))}
      </div>
    </section>
  );
}
