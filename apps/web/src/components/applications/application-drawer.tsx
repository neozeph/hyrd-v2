import { useEffect, useMemo, useRef, useState } from "react";

import { statusLabels } from "../../data/applications";
import { ApiError } from "../../lib/api-error";
import {
  apiDateTimeToDateInput,
  dateInputToApiDateTime,
  formatApplicationDate,
} from "../../lib/application-dates";
import type { ApplicationFormInput } from "../../lib/application-api";
import {
  useCreateApplicationMutation,
  useDeleteApplicationMutation,
  useApplicationDetailQuery,
  useUpdateApplicationMutation,
} from "../../lib/application-queries";
import type { ApplicationStatus, JobApplication } from "../../types/application";
import { applicationStatuses } from "../../types/application";
import { Icon } from "../ui/icons";

type DrawerMode = "create" | "view" | "edit" | "delete";

type FormState = {
  appliedDate: string;
  company: string;
  jobUrl: string;
  location: string;
  notes: string;
  position: string;
  status: ApplicationStatus;
};

const emptyForm: FormState = {
  appliedDate: "",
  company: "",
  jobUrl: "",
  location: "",
  notes: "",
  position: "",
  status: "saved",
};
const fieldClass =
  "mt-1 h-10 w-full rounded-[10px] border border-hyrd-border bg-white px-3 text-sm text-hyrd-text outline-none transition hover:border-slate-300 focus:border-hyrd-gold focus:ring-3 focus:ring-[#b28a4a33] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-hyrd-muted";
const selectClass = `${fieldClass} appearance-none pr-9`;
const textareaClass =
  "mt-1 min-h-24 w-full rounded-[10px] border border-hyrd-border bg-white px-3 py-2 text-sm text-hyrd-text outline-none transition hover:border-slate-300 focus:border-hyrd-gold focus:ring-3 focus:ring-[#b28a4a33] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-hyrd-muted";
const labelClass = "block text-sm font-medium text-hyrd-text";

function formFromApplication(application: JobApplication): FormState {
  return {
    appliedDate: apiDateTimeToDateInput(application.appliedAt),
    company: application.company,
    jobUrl: application.jobUrl ?? "",
    location: application.location ?? "",
    notes: application.notes ?? "",
    position: application.position,
    status: application.status,
  };
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function createPayload(form: FormState): ApplicationFormInput {
  return {
    company: form.company.trim(),
    position: form.position.trim(),
    status: form.status,
    ...(optionalValue(form.location) ? { location: optionalValue(form.location) } : {}),
    ...(optionalValue(form.jobUrl) ? { jobUrl: optionalValue(form.jobUrl) } : {}),
    ...(optionalValue(form.notes) ? { notes: optionalValue(form.notes) } : {}),
    ...(dateInputToApiDateTime(form.appliedDate)
      ? { appliedAt: dateInputToApiDateTime(form.appliedDate) }
      : {}),
  };
}

function updatePayload(
  form: FormState,
  original: JobApplication,
): Partial<ApplicationFormInput> {
  const originalForm = formFromApplication(original);
  const payload: Partial<ApplicationFormInput> = {};

  if (form.company.trim() !== originalForm.company) payload.company = form.company.trim();
  if (form.position.trim() !== originalForm.position) {
    payload.position = form.position.trim();
  }
  if (form.status !== originalForm.status) payload.status = form.status;
  if (form.location !== originalForm.location) {
    payload.location = optionalValue(form.location) ?? null;
  }
  if (form.jobUrl !== originalForm.jobUrl) {
    payload.jobUrl = optionalValue(form.jobUrl) ?? null;
  }
  if (form.notes !== originalForm.notes) {
    payload.notes = form.notes.trim() || null;
  }
  if (form.appliedDate !== originalForm.appliedDate) {
    payload.appliedAt = dateInputToApiDateTime(form.appliedDate) ?? null;
  }

  return payload;
}

function validateForm(form: FormState) {
  if (!form.company.trim()) return "Company is required.";
  if (!form.position.trim()) return "Position is required.";
  if (form.jobUrl.trim()) {
    try {
      const url = new URL(form.jobUrl.trim());
      if (!["http:", "https:"].includes(url.protocol)) return "Job URL must be valid.";
    } catch {
      return "Job URL must be valid.";
    }
  }
  return null;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Please try again.";
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-hyrd-border py-3">
      <dt className="text-xs font-semibold uppercase text-hyrd-muted">{label}</dt>
      <dd className="mt-1 text-sm text-hyrd-text">{value}</dd>
    </div>
  );
}

type ApplicationDrawerProps = {
  applicationId: string | null;
  initialMode: "create" | "view";
  isOpen: boolean;
  onClose: () => void;
  onExpiredSession: () => void;
};

export function ApplicationDrawer({
  applicationId,
  initialMode,
  isOpen,
  onClose,
  onExpiredSession,
}: ApplicationDrawerProps) {
  const [mode, setMode] = useState<DrawerMode>(initialMode);
  const [form, setForm] = useState<FormState>(
    initialMode === "create" ? emptyForm : emptyForm,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(document.activeElement);
  const detailQuery = useApplicationDetailQuery(
    applicationId,
    isOpen && applicationId !== null,
  );
  const createMutation = useCreateApplicationMutation();
  const updateMutation = useUpdateApplicationMutation(applicationId ?? "");
  const deleteMutation = useDeleteApplicationMutation(applicationId ?? "");
  const application = detailQuery.data;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = previousFocusRef.current;
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [isOpen]);

  const authError =
    detailQuery.error instanceof ApiError && detailQuery.error.status === 401
      ? detailQuery.error
      : createMutation.error instanceof ApiError && createMutation.error.status === 401
        ? createMutation.error
        : updateMutation.error instanceof ApiError && updateMutation.error.status === 401
          ? updateMutation.error
          : deleteMutation.error instanceof ApiError && deleteMutation.error.status === 401
            ? deleteMutation.error
            : null;

  useEffect(() => {
    if (authError !== null) onExpiredSession();
  }, [authError, onExpiredSession]);

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;
  const title = useMemo(() => {
    if (mode === "create") return "Add application";
    if (mode === "edit") return "Edit application";
    if (mode === "delete") return "Delete application";
    return "Application details";
  }, [mode]);

  if (!isOpen) return null;

  function setField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError !== null) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    try {
      await createMutation.mutateAsync(createPayload(form));
      setNotice("Application created.");
      onClose();
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (application === undefined) return;

    const validationError = validateForm(form);
    if (validationError !== null) {
      setFormError(validationError);
      return;
    }

    const payload = updatePayload(form, application);
    if (Object.keys(payload).length === 0) {
      setFormError("Change at least one field before saving.");
      return;
    }

    setFormError(null);
    try {
      await updateMutation.mutateAsync(payload);
      setNotice("Application updated.");
      setMode("view");
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  async function handleDelete() {
    if (applicationId === null) return;

    setFormError(null);
    try {
      await deleteMutation.mutateAsync();
      setNotice("Application deleted.");
      onClose();
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !isPending) onClose();
  }

  const formContent = (
    <form
      className="mt-5 space-y-4"
      onSubmit={mode === "create" ? handleCreate : handleUpdate}
    >
      <label className="block text-sm font-medium text-hyrd-text">
        Company
        <input
          className={fieldClass}
          disabled={isPending}
          onChange={(event) => setField("company", event.target.value)}
          value={form.company}
        />
      </label>
      <label className={labelClass}>
        Position
        <input
          className={fieldClass}
          disabled={isPending}
          onChange={(event) => setField("position", event.target.value)}
          value={form.position}
        />
      </label>
      <label className={labelClass}>
        Status
        <span className="relative block">
          <select
            className={selectClass}
            disabled={isPending}
            onChange={(event) =>
              setField("status", event.target.value as ApplicationStatus)
            }
            value={form.status}
          >
            {applicationStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <Icon
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 -rotate-90 text-hyrd-muted"
            name="chevron"
          />
        </span>
      </label>
      <label className={labelClass}>
        Location
        <input
          className={fieldClass}
          disabled={isPending}
          onChange={(event) => setField("location", event.target.value)}
          value={form.location}
        />
      </label>
      <label className={labelClass}>
        Job URL
        <input
          className={fieldClass}
          disabled={isPending}
          onChange={(event) => setField("jobUrl", event.target.value)}
          value={form.jobUrl}
        />
      </label>
      <label className={labelClass}>
        Applied date
        <input
          className={fieldClass}
          disabled={isPending}
          onChange={(event) => setField("appliedDate", event.target.value)}
          type="date"
          value={form.appliedDate}
        />
      </label>
      <label className={labelClass}>
        Notes
        <textarea
          className={textareaClass}
          disabled={isPending}
          onChange={(event) => setField("notes", event.target.value)}
          value={form.notes}
        />
      </label>
      {formError ? (
        <p aria-live="polite" className="text-sm text-rose-700">
          {formError}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          className="h-10 rounded-[10px] border border-hyrd-border px-4 text-sm font-semibold text-hyrd-text hover:bg-slate-50"
          disabled={isPending}
          onClick={() => (mode === "create" ? onClose() : setMode("view"))}
          type="button"
        >
          Cancel
        </button>
        <button
          className="h-10 rounded-[10px] bg-hyrd-gold px-4 text-sm font-semibold text-white hover:bg-hyrd-gold-dark disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving..." : mode === "create" ? "Create application" : "Save changes"}
        </button>
      </div>
    </form>
  );

  return (
    <div
      aria-labelledby="application-drawer-title"
      aria-modal="true"
      className="fixed inset-0 z-50"
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      <button
        aria-label="Close application drawer backdrop"
        className="absolute inset-0 h-full w-full bg-slate-950/30"
        disabled={isPending}
        onClick={onClose}
        type="button"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-white p-4 shadow-2xl sm:w-[90vw] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p aria-live="polite" className="min-h-5 text-sm text-emerald-700">
              {notice}
            </p>
            <h2
              className="text-xl font-semibold text-hyrd-text"
              id="application-drawer-title"
            >
              {title}
            </h2>
          </div>
          <button
            aria-label="Close application drawer"
            className="grid h-9 w-9 place-items-center rounded-lg text-hyrd-muted hover:bg-slate-100 hover:text-hyrd-text focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
            disabled={isPending}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            X
          </button>
        </div>

        {mode === "create" ? formContent : null}

        {mode !== "create" && detailQuery.isLoading ? (
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3, 4].map((item) => (
              <div className="h-12 animate-pulse rounded bg-slate-100" key={item} />
            ))}
          </div>
        ) : null}

        {mode !== "create" && detailQuery.error !== null ? (
          <div className="mt-6 rounded-[12px] border border-rose-200 p-4">
            <h3 className="font-semibold text-hyrd-text">
              Application could not load
            </h3>
            <p className="mt-2 text-sm text-hyrd-muted">
              {detailQuery.error instanceof ApiError && detailQuery.error.status === 404
                ? "This application was removed or is no longer available."
                : errorMessage(detailQuery.error)}
            </p>
            <button
              className="mt-4 h-10 rounded-[10px] border border-hyrd-border px-4 text-sm font-semibold text-hyrd-text hover:bg-slate-50"
              onClick={() => void detailQuery.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : null}

        {mode === "view" && application !== undefined ? (
          <div className="mt-5">
            <dl>
              <DetailRow label="Role" value={application.position} />
              <DetailRow label="Company" value={application.company} />
              <DetailRow label="Status" value={statusLabels[application.status]} />
              <DetailRow label="Location" value={application.location ?? "Not set"} />
              <DetailRow
                label="Job URL"
                value={
                  application.jobUrl ? (
                    <a
                      className="text-hyrd-gold-dark underline-offset-4 hover:underline"
                      href={application.jobUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {application.jobUrl}
                    </a>
                  ) : (
                    "Not set"
                  )
                }
              />
              <DetailRow
                label="Applied date"
                value={formatApplicationDate(application.appliedAt)}
              />
              <DetailRow label="Notes" value={application.notes ?? "Not set"} />
              <DetailRow
                label="Created"
                value={formatApplicationDate(application.createdAt)}
              />
              <DetailRow
                label="Last updated"
                value={formatApplicationDate(application.updatedAt)}
              />
            </dl>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-10 rounded-[10px] border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                onClick={() => setMode("delete")}
                type="button"
              >
                Delete
              </button>
              <button
                className="h-10 rounded-[10px] bg-hyrd-gold px-4 text-sm font-semibold text-white hover:bg-hyrd-gold-dark"
                onClick={() => {
                  setForm(formFromApplication(application));
                  setMode("edit");
                }}
                type="button"
              >
                Edit
              </button>
            </div>
          </div>
        ) : null}

        {mode === "edit" ? formContent : null}

        {mode === "delete" && application !== undefined ? (
          <div className="mt-6 rounded-[12px] border border-rose-200 p-4">
            <h3 className="font-semibold text-hyrd-text">Confirm deletion</h3>
            <p className="mt-2 text-sm text-hyrd-muted">
              Delete {application.position} at {application.company}? This cannot
              be undone.
            </p>
            {formError ? (
              <p aria-live="polite" className="mt-3 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-10 rounded-[10px] border border-hyrd-border px-4 text-sm font-semibold text-hyrd-text hover:bg-slate-50"
                disabled={isPending}
                onClick={() => setMode("view")}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-[10px] bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
                disabled={isPending}
                onClick={handleDelete}
                type="button"
              >
                {isPending ? "Deleting..." : "Delete application"}
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
