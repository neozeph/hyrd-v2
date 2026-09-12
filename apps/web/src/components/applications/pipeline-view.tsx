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
      <section className="border border-hyrd-border bg-white p-8 text-center">
        <h2 className="font-serif text-xl font-semibold text-hyrd-navy">
          No applications match
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-hyrd-muted">
          Try a different search or status filter.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Application pipeline cards"
      className="border border-hyrd-border bg-[#f9fafb] p-4"
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
