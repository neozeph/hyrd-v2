import { statusLabels } from "../../data/applications";
import type { JobApplication } from "../../types/application";
import { Icon } from "../ui/icons";
import { StatusLabel } from "./status-label";

function formatDate(date: string | null) {
  if (!date) return "Not started";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function TableView({ applications }: { applications: JobApplication[] }) {
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
                  <div className="font-semibold text-hyrd-text">
                    {application.position}
                  </div>
                  <div className="mt-1 text-hyrd-muted">{application.company}</div>
                </td>
                <td className="px-4 py-4">
                  <StatusLabel status={application.status} />
                  <span className="sr-only">{statusLabels[application.status]}</span>
                </td>
                <td className="px-4 py-4 text-hyrd-muted">{application.location}</td>
                <td className="px-4 py-4 text-hyrd-muted">
                  {formatDate(application.appliedDate)}
                </td>
                <td className="px-4 py-4 text-hyrd-muted">
                  {formatDate(application.lastUpdated)}
                </td>
                <td className="px-4 py-4">
                  <button
                    aria-label={`Open actions for ${application.position}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-hyrd-muted hover:bg-slate-100 hover:text-hyrd-text focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
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
