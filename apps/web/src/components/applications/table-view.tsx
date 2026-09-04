import { statusLabels } from "../../data/applications";
import { formatApplicationDate } from "../../lib/application-dates";
import type { JobApplication } from "../../types/application";
import { Icon } from "../ui/icons";
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
      className="overflow-hidden rounded-[14px] border border-hyrd-border bg-white"
    >
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="border-b border-hyrd-border bg-[#f9fafb] text-xs uppercase tracking-[0.08em] text-hyrd-muted">
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
              <tr className="align-top" key={application.id}>
                <td className="px-4 py-4">
                  <div className="break-words font-semibold text-hyrd-text">
                    {application.position}
                  </div>
                  <div className="mt-1 break-words text-hyrd-muted">
                    {application.company}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusLabel status={application.status} />
                  <span className="sr-only">{statusLabels[application.status]}</span>
                </td>
                <td className="px-4 py-4 text-hyrd-muted">
                  {application.location ?? "Location not set"}
                </td>
                <td className="px-4 py-4 text-hyrd-muted">
                  {formatApplicationDate(application.appliedAt, "Not started")}
                </td>
                <td className="px-4 py-4 text-hyrd-muted">
                  {formatApplicationDate(application.updatedAt)}
                </td>
                <td className="px-4 py-4">
                  <button
                    aria-label={`View details for ${application.position}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-hyrd-muted hover:bg-slate-100 hover:text-hyrd-text focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                    onClick={() => onOpen?.(application.id)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="more" />
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
