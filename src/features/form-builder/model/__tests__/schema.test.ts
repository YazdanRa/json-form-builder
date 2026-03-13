import { describe, expect, it } from "vitest";

import { buildSchema } from "../schema";
import { createField } from "../factories";
import type { FieldType, FormDefinition } from "../types";

function buildSingleFieldForm(fieldType: FieldType): FormDefinition {
  const field = createField(fieldType);
  field.key = `${fieldType}_field`;
  field.title = `${fieldType} field`;
  field.placeholder = "Placeholder";

  if (fieldType === "enum") {
    field.options = ["Alpha", "Beta"];
  }

  if (fieldType === "object" || fieldType === "array_object" || fieldType === "section") {
    field.children = [createField("string")];
    field.children[0].key = "child_name";
    field.children[0].title = "Child Name";
  }

  return {
    title: "Single field form",
    description: "",
    fields: [field],
  };
}

describe("buildSchema", () => {
  it.each([
    ["string", "string"],
    ["textarea", "string"],
    ["number", "number"],
    ["integer", "integer"],
    ["boolean", "boolean"],
    ["email", "string"],
    ["date", "string"],
    ["enum", "string"],
    ["object", "object"],
    ["array_string", "array"],
    ["array_object", "array"],
  ] as const)("builds schema for %s fields", (fieldType, expectedType) => {
    const schema = buildSchema(buildSingleFieldForm(fieldType));
    const key = `${fieldType}_field`;
    expect(schema.properties[key]?.type).toBe(expectedType);
  });

  it("flattens sections into properties and preserves section metadata", () => {
    const schema = buildSchema(buildSingleFieldForm("section"));

    expect(schema.properties.child_name).toBeDefined();
    expect(schema["x-sections"]).toHaveLength(1);
    expect(schema["x-sections"][0]?.fields).toEqual(["child_name"]);
  });

  it("compiles required fields and conditional rules into allOf", () => {
    const controller = createField("enum");
    controller.key = "request_type";
    controller.title = "Request Type";
    controller.required = true;
    controller.options = ["Bug", "Feature"];

    const dependent = createField("object");
    dependent.key = "bug_details";
    dependent.title = "Bug Details";
    dependent.conditions = [{ id: crypto.randomUUID(), dependsOn: "request_type", equals: "Bug" }];
    dependent.children = [createField("string")];
    dependent.children[0].key = "steps";
    dependent.children[0].title = "Steps";

    const schema = buildSchema({
      title: "Conditional form",
      description: "",
      fields: [controller, dependent],
    });

    expect(schema.required).toContain("request_type");
    expect(schema.allOf).toEqual([
      {
        if: {
          properties: {
            request_type: { const: "Bug" },
          },
          required: ["request_type"],
        },
        then: {
          required: ["bug_details"],
        },
      },
    ]);
  });
});
