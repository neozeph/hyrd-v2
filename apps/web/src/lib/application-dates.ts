export function dateInputToApiDateTime(value: string): string | undefined {
  if (!value) return undefined;
  return `${value}T00:00:00.000Z`;
}

export function apiDateTimeToDateInput(value?: string): string {
  if (value === undefined) return "";
  return value.slice(0, 10);
}

export function formatApplicationDate(value?: string, fallback = "Not set") {
  if (value === undefined) return fallback;

  const [year, month, day] = apiDateTimeToDateInput(value).split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShortApplicationDate(value?: string, fallback = "Not set") {
  if (value === undefined) return fallback;

  const [year, month, day] = apiDateTimeToDateInput(value).split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}
