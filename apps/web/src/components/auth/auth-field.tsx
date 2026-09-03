import { useId, useState } from "react";

import { Icon } from "../ui/icons";

type AuthFieldProps = {
  autoComplete: string;
  compact?: boolean;
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  type?: "email" | "password" | "text";
  value: string;
};

export function AuthField({
  autoComplete,
  compact = false,
  error,
  label,
  name,
  onChange,
  type = "text",
  value,
}: AuthFieldProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div>
      <label className="block text-sm font-medium text-hyrd-text" htmlFor={id}>
        {label}
      </label>
      <div className={`relative ${compact ? "mt-1.5" : "mt-2"}`}>
        <input
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={`w-full rounded-[10px] border border-hyrd-border bg-white px-3.5 text-sm text-hyrd-text outline-none transition focus:border-hyrd-gold focus:ring-3 focus:ring-[#b28a4a33] ${
            compact ? "py-2" : "py-2.5"
          }`}
          id={id}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          type={inputType}
          value={value}
        />
        {isPassword ? (
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-hyrd-muted transition hover:bg-slate-100 hover:text-hyrd-text focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            <Icon className="h-4.5 w-4.5" name="eye" />
          </button>
        ) : null}
      </div>
      <p
        className={`${compact ? "mt-1 min-h-3 text-xs" : "mt-2 min-h-5 text-sm"} text-red-700`}
        id={`${id}-error`}
      >
        {error}
      </p>
    </div>
  );
}
