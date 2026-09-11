import { statusLabels } from "../../data/applications";
import type { ApplicationStatus } from "../../types/application";

const statusStyles: Record<ApplicationStatus, string> = {
  saved: "border-hyrd-border bg-white text-hyrd-text",
  applied: "border-hyrd-navy/35 bg-hyrd-navy/5 text-hyrd-navy",
  screening: "border-hyrd-navy/35 bg-hyrd-navy/5 text-hyrd-navy",
  assessment: "border-hyrd-navy/35 bg-hyrd-navy/5 text-hyrd-navy",
  interview: "border-hyrd-gold/50 bg-[#fffaf0] text-hyrd-gold-dark",
  offer: "border-hyrd-gold/60 bg-[#fffaf0] text-hyrd-gold-dark",
  rejected: "border-rose-200 bg-white text-rose-700",
  withdrawn: "border-hyrd-border bg-white text-hyrd-muted",
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
