import { describe, expect, it } from "vitest";

import { normalizeFormDefinition } from "../normalization";

describe("normalizeFormDefinition", () => {
  it("migrates legacy section fields to objects", () => {
    const form = normalizeFormDefinition({
      title: "Legacy",
      description: "Draft",
      fields: [
        {
          id: "legacy-section",
          key: "contact_section",
          title: "Contact",
          description: "",
          type: "section",
          required: false,
          options: [],
          conditions: [],
          children: [],
        },
      ],
    });

    expect(form.fields[0]?.type).toBe("object");
  });
});
