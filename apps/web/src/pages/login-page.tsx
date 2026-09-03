import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";

import { useAuth } from "../auth/use-auth";
import { AuthField } from "../components/auth/auth-field";
import { AuthShell } from "../components/auth/auth-shell";
import { ApiError } from "../lib/api-error";

type LoginErrors = Partial<Record<"email" | "password" | "form", string>>;

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = location.state?.from?.pathname ?? "/dashboard";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: LoginErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email, password });
      setPassword("");
      navigate(from, { replace: true });
    } catch (error) {
      setPassword("");
      setErrors({
        form:
          error instanceof ApiError
            ? error.message
            : "Unable to log in. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <p aria-live="polite" className="min-h-5 text-sm text-hyrd-muted">
          {errors.form}
        </p>
        <button
          className="w-full rounded-[10px] bg-hyrd-gold px-4 py-3 text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
