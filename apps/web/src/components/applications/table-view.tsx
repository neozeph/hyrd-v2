import { formatApplicationDate } from "../../lib/application-dates";
import type { JobApplication } from "../../types/application";
import { StatusLabel } from "./status-label";

export function TableView({
  applications,
  onOpen,
}: {
  applications: JobApplication[];
  onOpen?: (applicationId: string) => void;
}) {
  return (
    <section
      aria-label="Applications table"
      className="overflow-hidden border border-hyrd-border bg-white"
    >
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="border-b-2 border-hyrd-border bg-[#f9fafb] text-xs uppercase tracking-[0.12em] text-hyrd-navy/75">
            <tr>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Applied</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hyrd-border">
            {applications.map((application) => (
              <tr className="align-top transition hover:bg-[#fbfaf6]" key={application.id}>
                <td className="px-4 py-4">
                  <div className="break-words text-lg font-bold uppercase leading-tight text-hyrd-navy">
                    {application.position}
                  </div>
                  <div className="mt-1.5 break-words font-serif text-base font-light leading-tight text-hyrd-text">
                    {application.company}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusLabel status={application.status} />
                </td>
                <td className="px-4 py-4 font-serif text-sm font-light text-hyrd-muted">
                  {application.location ?? "Location not set"}
                </td>
                <td className="px-4 py-4 text-xs uppercase tracking-[0.08em] text-hyrd-muted">
                  {formatApplicationDate(application.appliedAt, "Not started")}
                </td>
                <td className="px-4 py-4 text-xs uppercase tracking-[0.08em] text-hyrd-muted">
                  {formatApplicationDate(application.updatedAt)}
                </td>
                <td className="px-4 py-4">
                  <button
                    aria-label={`View details for ${application.position}`}
                    className="inline-flex h-8 items-center justify-center bg-hyrd-navy px-3 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-hyrd-deep active:translate-y-px focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                    onClick={() => onOpen?.(application.id)}
                    type="button"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
