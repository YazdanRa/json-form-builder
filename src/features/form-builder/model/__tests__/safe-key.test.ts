import { describe, expect, it } from "vitest";

import { toSafeKey } from "../factories";

describe("toSafeKey", () => {
  it("normalizes mixed input into snake_case", () => {
    expect(toSafeKey("Full Name")).toBe("full_name");
    expect(toSafeKey(" Request Type / Kind ")).toBe("request_type_kind");
  });

  it("falls back when the input is empty", () => {
    expect(toSafeKey("", "fallback_field")).toBe("fallback_field");
  });
});
