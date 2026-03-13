import { describe, expect, it } from "vitest";

import { createField } from "../factories";
import { validateFormDefinition } from "../validation";

describe("validateFormDefinition", () => {
  it("flags duplicate keys in the same scope", () => {
    const rootField = createField("string");
    rootField.key = "name";

    const duplicateRootField = createField("string");
    duplicateRootField.key = "name";

    const nestedObject = createField("object");
    nestedObject.key = "details";
    nestedObject.children = [createField("string")];
    nestedObject.children[0].key = "name";

    const result = validateFormDefinition({
      title: "Validation",
      description: "",
      fields: [rootField, duplicateRootField, nestedObject],
    });

    expect(result.hasBlockingIssues).toBe(true);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.every((issue) => issue.key === "name")).toBe(true);
    expect(result.issues.every((issue) => issue.scopePath === "root")).toBe(true);
  });
});
