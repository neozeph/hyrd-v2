import { statusLabels } from "../../data/applications";
import type { ApplicationStatus } from "../../types/application";

const statusStyles: Record<ApplicationStatus, string> = {
  saved: "border-orange-200 bg-orange-50 text-orange-800",
  applied: "border-amber-200 bg-amber-50 text-amber-800",
  screening: "border-green-200 bg-green-50 text-green-800",
  assessment: "border-blue-200 bg-blue-50 text-blue-800",
  interview: "border-indigo-200 bg-indigo-50 text-indigo-800",
  offer: "border-violet-200 bg-violet-50 text-violet-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  withdrawn: "border-red-200 bg-red-50 text-red-800",
};

export function StatusLabel({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex border px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
