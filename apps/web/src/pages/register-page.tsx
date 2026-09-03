import { useState } from "react";
import type { FormEvent } from "react";

import { AuthField } from "../components/auth/auth-field";
import { AuthShell } from "../components/auth/auth-shell";

type RegisterErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "form", string>
>;

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    if (
      !nextErrors.name &&
      !nextErrors.email &&
      !nextErrors.password &&
      !nextErrors.confirmPassword
    ) {
      nextErrors.form = "Account creation will connect to the API later.";
    }
    setErrors(nextErrors);
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
        <p className="min-h-3 text-sm text-hyrd-muted">{errors.form}</p>
        <button
          className="w-full rounded-[10px] bg-hyrd-gold px-4 py-2 text-sm font-semibold text-white transition hover:bg-hyrd-gold-dark focus:outline-none focus:ring-3 focus:ring-[#b28a4a55]"
          type="submit"
        >
          Create account
        </button>
      </form>
    </AuthShell>
  );
}
