import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../auth/use-auth";
import { AuthField } from "../components/auth/auth-field";
import { AuthShell } from "../components/auth/auth-shell";
import { ApiError } from "../lib/api-error";
import { getPasswordStrength } from "../lib/password-strength";

type RegisterErrors = Partial<
  Record<
    "name" | "email" | "password" | "confirmPassword" | "form",
    string | string[]
  >
>;

type RegistrationField = "name" | "email" | "password";

const registrationFields = ["name", "email", "password"] as const;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maximumEmailLength = 254;
const maximumNameLength = 120;
const minimumPasswordLength = 12;
const maximumPasswordLength = 128;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function uniqueMessages(messages: unknown) {
  if (!Array.isArray(messages)) return [];

  return [
    ...new Set(
      messages.filter((message): message is string => typeof message === "string"),
    ),
  ];
}

function getRegistrationFieldErrors(error: ApiError) {
  const details = error.details;
  if (!isRecord(details) || !isRecord(details.fieldErrors)) {
    return {};
  }
  const { fieldErrors: rawFieldErrors } = details;

  return registrationFields.reduce<Partial<Record<RegistrationField, string[]>>>(
    (fieldErrors, field) => {
      const messages = uniqueMessages(rawFieldErrors[field]);
      if (messages.length > 0) fieldErrors[field] = messages;
      return fieldErrors;
    },
    {},
  );
}

function getRegistrationFormError(error: ApiError) {
  if (!isRecord(error.details)) return undefined;

  const formErrors = uniqueMessages(error.details.formErrors);
  return formErrors.length > 0 ? formErrors : undefined;
}

function PasswordStrengthMeter({
  email,
  name,
  password,
}: {
  email: string;
  name: string;
  password: string;
}) {
  if (!password) return null;

  const strength = getPasswordStrength({ email, name, password });

  return (
    <div
      aria-label={`Password strength: ${strength.rating}`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={strength.score}
      className="mt-2"
      role="progressbar"
    >
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-hyrd-gold transition-[width]"
          style={{ width: `${strength.score}%` }}
        />
      </div>
      <p aria-live="polite" className="mt-1 text-xs text-hyrd-muted">
        Strength: <span className="font-medium text-hyrd-text">{strength.rating}</span>
      </p>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
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
    if (name.trim().length > maximumNameLength) {
      nextErrors.name = "Name must contain at most 120 characters.";
    }
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (email.trim() && !emailPattern.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (email.trim().length > maximumEmailLength) {
      nextErrors.email = "Email must contain at most 254 characters.";
    }
    if (!password) nextErrors.password = "Password is required.";
    if (password && password.length < minimumPasswordLength) {
      nextErrors.password = "Use at least 12 characters.";
    }
    if (password.length > maximumPasswordLength) {
      nextErrors.password = "Password must contain at most 128 characters.";
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
      if (nextErrors.name) nameRef.current?.focus();
      else if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      else if (nextErrors.confirmPassword) confirmPasswordRef.current?.focus();
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
      if (error instanceof ApiError) {
        const fieldErrors = getRegistrationFieldErrors(error);
        const formError = getRegistrationFormError(error);
        const hasFieldErrors = registrationFields.some((field) => fieldErrors[field]);

        setErrors({
          ...fieldErrors,
          form: formError ?? (hasFieldErrors ? undefined : error.message),
        });

        if (fieldErrors.name) nameRef.current?.focus();
        else if (fieldErrors.email) emailRef.current?.focus();
        else if (fieldErrors.password) passwordRef.current?.focus();
      } else {
        setErrors({
          form: "Unable to create your account. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof RegisterErrors, value: string) {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      form: undefined,
    }));
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
          inputRef={nameRef}
          label="Name"
          name="name"
          onChange={(value) => updateField("name", value)}
          value={name}
        />
        <AuthField
          autoComplete="email"
          compact
          error={errors.email}
          inputRef={emailRef}
          label="Email"
          name="email"
          onChange={(value) => updateField("email", value)}
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="new-password"
          compact
          error={errors.password}
          helperText="Use at least 12 characters."
          inputRef={passwordRef}
          label="Password"
          name="password"
          onChange={(value) => updateField("password", value)}
          renderAfterInput={
            <PasswordStrengthMeter email={email} name={name} password={password} />
          }
          type="password"
          value={password}
        />
        <AuthField
          autoComplete="new-password"
          compact
          error={errors.confirmPassword}
          inputRef={confirmPasswordRef}
          label="Confirm password"
          name="confirmPassword"
          onChange={(value) => updateField("confirmPassword", value)}
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
