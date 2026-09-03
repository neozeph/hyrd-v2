import { useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "../components/auth/auth-field";
import { AuthShell } from "../components/auth/auth-shell";

type LoginErrors = Partial<Record<"email" | "password" | "form", string>>;

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: LoginErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";
    if (!nextErrors.email && !nextErrors.password) {
      nextErrors.form = "API integration is next; this form is visual-only.";
    }
    setErrors(nextErrors);
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      heading="Log in to your application tracker"
      intro="Review your pipeline, follow-ups, and offers without rebuilding the context from scratch."
      mode="login"
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete="email"
          error={errors.email}
          label="Email"
          name="email"
          onChange={setEmail}
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="current-password"
          error={errors.password}
          label="Password"
          name="password"
          onChange={setPassword}
          type="password"
          value={password}
        />
        <p className="min-h-5 text-sm text-hyrd-muted">{errors.form}</p>
        <button
          className="w-full rounded-[10px] bg-hyrd-gold px-4 py-3 text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55]"
          type="submit"
        >
          Log in
        </button>
      </form>
    </AuthShell>
  );
}
