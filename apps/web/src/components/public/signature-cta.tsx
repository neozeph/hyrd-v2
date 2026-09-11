import { Link } from "react-router";

type SignatureCTAProps = {
  children: React.ReactNode;
  className?: string;
  to: string;
};

type SignatureButtonProps = {
  "aria-label"?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  type?: "button" | "submit";
};

export function SignatureCTA({
  children,
  className = "",
  to,
}: SignatureCTAProps) {
  return (
    <Link
      className={`hyrd-signature-cta inline-flex min-h-12 items-center justify-center px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] focus:outline-none ${className}`}
      to={to}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

export function SignatureButton({
  "aria-label": ariaLabel,
  children,
  className = "",
  disabled = false,
  onClick,
  title,
  type = "button",
}: SignatureButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`hyrd-signature-cta inline-flex min-h-12 items-center justify-center px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] focus:outline-none ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type={type}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
