import { describe, expect, it } from "vitest";

import { buildSchema } from "../schema";
import { createInitialFormDefinition } from "../factories";
import { importFormDefinitionJson } from "../import";

describe("importFormDefinitionJson", () => {
  it("accepts builder draft json", () => {
    const result = importFormDefinitionJson(
      JSON.stringify({
        title: "Imported draft",
        description: "Loaded from paste",
        fields: [],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.form.title).toBe("Imported draft");
    expect(result.form.description).toBe("Loaded from paste");
    expect(result.form.fields).toEqual([]);
  });

  it("converts supported exported schema back into editable builder fields", () => {
    const schema = buildSchema(createInitialFormDefinition());

    const result = importFormDefinitionJson(JSON.stringify(schema));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.form.title).toBe("Project Intake Form");
    expect(result.form.fields.map((field) => field.key)).toEqual([
      "contact_details",
      "request_type",
      "bug_details",
      "links",
      "team_members",
    ]);

    expect(result.form.fields[0]?.type).toBe("object");
    expect(result.form.fields[0]?.children.map((field) => field.key)).toEqual(["full_name", "email"]);
    expect(result.form.fields[1]?.type).toBe("enum");
    expect(result.form.fields[1]?.options).toEqual(["Bug", "Feature", "Support"]);
    expect(result.form.fields[2]?.conditions).toHaveLength(1);
    expect(result.form.fields[2]?.conditions[0]).toMatchObject({
      dependsOn: "request_type",
      operator: "equals",
      value: "Bug",
    });
    expect(result.form.fields[4]?.type).toBe("array_object");
    expect(result.form.fields[4]?.children.map((field) => field.key)).toEqual(["name", "role"]);
  });

  it("rejects invalid json", () => {
    const result = importFormDefinitionJson("{");

    expect(result).toEqual({
      ok: false,
      error: "Pasted text is not valid JSON.",
    });
  });

  it("rejects unsupported schema constructs", () => {
    const result = importFormDefinitionJson(
      JSON.stringify({
        title: "Unsupported",
        type: "object",
        properties: {
          request: {
            type: "string",
            format: "uri",
          },
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: 'Unsupported string format "uri" at "request".',
    });
  });

  it("rejects unsupported conditional branches", () => {
    const result = importFormDefinitionJson(
      JSON.stringify({
        title: "Conditional",
        type: "object",
        properties: {
          request_type: {
            title: "Request Type",
            type: "string",
            enum: ["Bug", "Feature"],
          },
          bug_details: {
            title: "Bug Details",
            type: "object",
            properties: {},
          },
        },
        allOf: [
          {
            if: {
              properties: {
                request_type: { pattern: "Bug" },
              },
              required: ["request_type"],
            },
            then: {
              required: ["bug_details"],
            },
          },
        ],
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: 'Unsupported conditional branch at "allOf[0]".',
    });
  });

  it("imports a conditional branch that requires multiple target fields", () => {
    const result = importFormDefinitionJson(
      JSON.stringify({
        title: "Conditional",
        type: "object",
        properties: {
          request_type: {
            title: "Request Type",
            type: "string",
            enum: ["Bug", "Feature"],
          },
          bug_summary: {
            title: "Bug Summary",
            type: "string",
          },
          bug_steps: {
            title: "Bug Steps",
            type: "string",
          },
        },
        allOf: [
          {
            if: {
              properties: {
                request_type: { const: "Bug" },
              },
              required: ["request_type"],
            },
            then: {
              required: ["bug_summary", "bug_steps"],
            },
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    expect(result.form.fields[1]?.conditions).toHaveLength(1);
    expect(result.form.fields[1]?.conditions[0]).toMatchObject({
      dependsOn: "request_type",
      operator: "equals",
      value: "Bug",
    });
    expect(result.form.fields[2]?.conditions).toHaveLength(1);
    expect(result.form.fields[2]?.conditions[0]).toMatchObject({
      dependsOn: "request_type",
      operator: "equals",
      value: "Bug",
    });
  });

  it("imports grouped conditions with presence checks, enum membership, and repeated target branches", () => {
    const result = importFormDefinitionJson(
      JSON.stringify({
        title: "Impact to Schedule",
        description: "Records schedule impact due to various factors.",
        type: "object",
        properties: {
          reason_for_impact: {
            type: "string",
            enum: ["Lack of workers", "Productivity"],
          },
          workers_unavailable: {
            type: "string",
          },
          impact_on_schedule: {
            type: "string",
          },
          affect_other_workers: {
            type: "string",
            enum: ["Yes", "No"],
          },
          other_workers_affected: {
            type: "string",
          },
          critical_path_effect: {
            type: "string",
            enum: ["Yes", "No"],
          },
          performance_concern: {
            type: "string",
            enum: ["Workers", "Materials", "Both"],
          },
          days_lost: {
            type: "string",
          },
        },
        required: ["reason_for_impact"],
        allOf: [
          {
            if: {
              required: ["reason_for_impact"],
              properties: {
                reason_for_impact: { const: "Lack of workers" },
              },
            },
            then: {
              required: ["workers_unavailable"],
            },
          },
          {
            if: {
              required: ["reason_for_impact", "workers_unavailable"],
              properties: {
                reason_for_impact: { const: "Lack of workers" },
                workers_unavailable: {},
              },
            },
            then: {
              required: ["impact_on_schedule"],
            },
          },
          {
            if: {
              required: ["reason_for_impact", "performance_concern"],
              properties: {
                reason_for_impact: { const: "Productivity" },
                performance_concern: { enum: ["Workers", "Both"] },
              },
            },
            then: {
              required: ["days_lost"],
            },
          },
          {
            if: {
              required: ["reason_for_impact", "critical_path_effect"],
              properties: {
                reason_for_impact: { const: "Lack of workers" },
                critical_path_effect: { const: "Yes" },
              },
            },
            then: {
              required: ["days_lost"],
            },
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful import");
    }

    const impactField = result.form.fields.find((field) => field.key === "impact_on_schedule");
    expect(impactField?.conditions).toHaveLength(2);
    expect(impactField?.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dependsOn: "reason_for_impact",
          operator: "equals",
          value: "Lack of workers",
        }),
        expect.objectContaining({
          dependsOn: "workers_unavailable",
          operator: "present",
        }),
      ]),
    );

    const daysLostField = result.form.fields.find((field) => field.key === "days_lost");
    expect(daysLostField?.conditions).toHaveLength(4);
    expect(daysLostField?.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dependsOn: "performance_concern",
          operator: "one_of",
          values: ["Workers", "Both"],
        }),
        expect.objectContaining({
          dependsOn: "critical_path_effect",
          operator: "equals",
          value: "Yes",
        }),
      ]),
    );
  });
});
