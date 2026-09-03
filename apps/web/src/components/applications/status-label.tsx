import { statusLabels } from "../../data/applications";
import type { ApplicationStatus } from "../../types/application";

const statusStyles: Record<ApplicationStatus, string> = {
  saved: "border-slate-300 bg-slate-50 text-slate-700",
  applied: "border-blue-200 bg-blue-50 text-blue-800",
  screening: "border-cyan-200 bg-cyan-50 text-cyan-800",
  assessment: "border-violet-200 bg-violet-50 text-violet-800",
  interview: "border-amber-200 bg-amber-50 text-amber-800",
  offer: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
  withdrawn: "border-stone-300 bg-stone-50 text-stone-700",
};

export function StatusLabel({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
