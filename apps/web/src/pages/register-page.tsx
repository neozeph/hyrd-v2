import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../auth/use-auth";
import { AuthField } from "../components/auth/auth-field";
import { AuthShell } from "../components/auth/auth-shell";
import { ApiError } from "../lib/api-error";

type RegisterErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "form", string>
>;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: RegisterErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";
    if (password && password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);

    if (
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ email, name: name.trim(), password });
      setPassword("");
      setConfirmPassword("");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setPassword("");
      setConfirmPassword("");
      setErrors({
        form:
          error instanceof ApiError
            ? error.message
            : "Unable to create your account. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Start organized"
      heading="Create your HYRD workspace"
      intro="Set up a focused place for saved roles, active applications, interviews, and outcomes."
      mode="register"
    >
      <form className="space-y-2.5" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete="name"
          compact
          error={errors.name}
          label="Name"
          name="name"
          onChange={setName}
          value={name}
        />
        <AuthField
          autoComplete="email"
          compact
          error={errors.email}
          label="Email"
          name="email"
          onChange={setEmail}
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="new-password"
          compact
          error={errors.password}
          label="Password"
          name="password"
          onChange={setPassword}
          type="password"
          value={password}
        />
        <AuthField
          autoComplete="new-password"
          compact
          error={errors.confirmPassword}
          label="Confirm password"
          name="confirmPassword"
          onChange={setConfirmPassword}
          type="password"
          value={confirmPassword}
        />
        <p aria-live="polite" className="min-h-3 text-sm text-hyrd-muted">
          {errors.form}
        </p>
        <button
          className="w-full rounded-[10px] bg-hyrd-gold px-4 py-2 text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
