import { describe, expect, it } from "vitest";

import { buildSchema } from "../schema";
import { createField } from "../factories";
import type { FieldType, FormDefinition } from "../types";

function buildSingleFieldForm(fieldType: FieldType): FormDefinition {
  const field = createField(fieldType);
  field.key = `${fieldType}_field`;
  field.title = `${fieldType} field`;

  if (fieldType === "enum") {
    field.options = ["Alpha", "Beta"];
  }

  if (fieldType === "object" || fieldType === "array_object") {
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

  it("compiles conditional visibility into native allOf branches", () => {
    const requiredField = createField("enum");
    requiredField.key = "request_type";
    requiredField.title = "Request Type";
    requiredField.required = true;
    requiredField.options = ["Bug", "Feature"];

    const optionalField = createField("object");
    optionalField.key = "bug_details";
    optionalField.title = "Bug Details";
    optionalField.conditions = [
      {
        id: "condition-1",
        groupId: "group-1",
        dependsOn: "request_type",
        operator: "equals",
        value: "Bug",
        values: [],
      },
    ];
    optionalField.children = [createField("string")];
    optionalField.children[0].key = "steps";
    optionalField.children[0].title = "Steps";

    const schema = buildSchema({
      title: "Required form",
      description: "",
      fields: [requiredField, optionalField],
    });

    expect(schema.required).toContain("request_type");
    expect(schema.required).not.toContain("bug_details");
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

  it("omits custom x-prefixed metadata from exported fields", () => {
    const stringSchema = buildSchema(buildSingleFieldForm("string")).properties.string_field;
    const textareaSchema = buildSchema(buildSingleFieldForm("textarea")).properties.textarea_field;
    const emailSchema = buildSchema(buildSingleFieldForm("email")).properties.email_field;

    expect(textareaSchema).not.toHaveProperty("x-ui");
    expect(stringSchema).not.toHaveProperty("x-placeholder");
    expect(textareaSchema).not.toHaveProperty("x-placeholder");
    expect(emailSchema).not.toHaveProperty("x-placeholder");
  });

  it("does not add condition-controlled fields to unconditional required arrays", () => {
    const conditionalField = createField("string");
    conditionalField.key = "details";
    conditionalField.title = "Details";
    conditionalField.required = true;
    conditionalField.conditions = [
      {
        id: "condition-1",
        groupId: "group-1",
        dependsOn: "request_type",
        operator: "equals",
        value: "Bug",
        values: [],
      },
    ];

    const schema = buildSchema({
      title: "Conditional required form",
      description: "",
      fields: [createField("enum"), conditionalField],
    });

    expect(schema.required ?? []).not.toContain("details");
    expect(schema.allOf).toBeDefined();
  });

  it("keeps nested object properties inside the object field", () => {
    const schema = buildSchema(buildSingleFieldForm("object"));

    expect(schema.properties.object_field?.type).toBe("object");
    expect(schema.properties.object_field?.properties?.child_name?.type).toBe("string");
  });

  it("exports grouped conditions with presence and enum membership checks", () => {
    const reasonField = createField("enum");
    reasonField.key = "reason_for_impact";
    reasonField.title = "Reason";
    reasonField.options = ["Lack of workers", "Productivity"];
    reasonField.required = true;

    const performanceField = createField("enum");
    performanceField.key = "performance_concern";
    performanceField.title = "Performance Concern";
    performanceField.options = ["Workers", "Materials", "Both"];

    const workersField = createField("string");
    workersField.key = "workers_unavailable";
    workersField.title = "Workers Unavailable";

    const daysLostField = createField("string");
    daysLostField.key = "days_lost";
    daysLostField.title = "Days Lost";
    daysLostField.conditions = [
      {
        id: "condition-1",
        groupId: "group-1",
        dependsOn: "reason_for_impact",
        operator: "equals",
        value: "Productivity",
        values: [],
      },
      {
        id: "condition-2",
        groupId: "group-1",
        dependsOn: "performance_concern",
        operator: "one_of",
        value: "",
        values: ["Workers", "Both"],
      },
      {
        id: "condition-3",
        groupId: "group-2",
        dependsOn: "reason_for_impact",
        operator: "equals",
        value: "Lack of workers",
        values: [],
      },
      {
        id: "condition-4",
        groupId: "group-2",
        dependsOn: "workers_unavailable",
        operator: "present",
        value: "",
        values: [],
      },
    ];

    const schema = buildSchema({
      title: "Conditional form",
      description: "",
      fields: [reasonField, performanceField, workersField, daysLostField],
    });

    expect(schema.allOf).toEqual([
      {
        if: {
          properties: {
            reason_for_impact: { const: "Productivity" },
            performance_concern: { enum: ["Workers", "Both"] },
          },
          required: ["reason_for_impact", "performance_concern"],
        },
        then: {
          required: ["days_lost"],
        },
      },
      {
        if: {
          properties: {
            reason_for_impact: { const: "Lack of workers" },
            workers_unavailable: {},
          },
          required: ["reason_for_impact", "workers_unavailable"],
        },
        then: {
          required: ["days_lost"],
        },
      },
    ]);
  });
});
