import { describe, expect, it } from "vitest";

import {
  apiDateTimeToDateInput,
  dateInputToApiDateTime,
  formatApplicationDate,
} from "./application-dates";

describe("application date helpers", () => {
  it("round-trips date-only input without timezone drift", () => {
    const apiValue = dateInputToApiDateTime("2026-08-20");

    expect(apiValue).toBe("2026-08-20T00:00:00.000Z");
    expect(apiDateTimeToDateInput(apiValue)).toBe("2026-08-20");
    expect(formatApplicationDate(apiValue)).toBe("Aug 20, 2026");
  });
});
