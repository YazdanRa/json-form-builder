import { buildJsonSchemaCondition } from "./conditions";
import { resolveFieldKey } from "./factories";
import type { FormDefinition, FormField, JsonSchemaCondition, JsonSchemaDocument, JsonSchemaNode } from "./types";

function buildFieldCollection(fields: FormField[]) {
  const properties: Record<string, JsonSchemaNode> = {};
  const required: string[] = [];
  const allOf: JsonSchemaCondition[] = [];

  fields.forEach((field, index) => {
    const key = resolveFieldKey(field, index);
    const isConditionControlled = field.conditions.length > 0;
    const base: JsonSchemaNode = {
      title: field.title || "Untitled question",
      description: field.description || undefined,
    };

    let schema: JsonSchemaNode = { ...base, type: "string" };

    switch (field.type) {
      case "string":
      case "textarea":
        schema = { ...base, type: "string" };
        break;
      case "number":
        schema = { ...base, type: "number" };
        break;
      case "integer":
        schema = { ...base, type: "integer" };
        break;
      case "boolean":
        schema = { ...base, type: "boolean" };
        break;
      case "email":
        schema = {
          ...base,
          type: "string",
          format: "email",
        };
        break;
      case "date":
        schema = { ...base, type: "string", format: "date" };
        break;
      case "enum":
        schema = {
          ...base,
          type: "string",
          enum: field.options.map((option) => option.trim()).filter(Boolean),
        };
        break;
      case "object": {
        const nested = buildFieldCollection(field.children);
        schema = {
          ...base,
          type: "object",
          properties: nested.properties,
          required: nested.required.length ? nested.required : undefined,
          allOf: nested.allOf.length ? nested.allOf : undefined,
        };
        break;
      }
      case "array_string":
        schema = {
          ...base,
          type: "array",
          items: { type: "string" },
        };
        break;
      case "array_object": {
        const nested = buildFieldCollection(field.children);
        schema = {
          ...base,
          type: "array",
          items: {
            type: "object",
            properties: nested.properties,
            required: nested.required.length ? nested.required : undefined,
            allOf: nested.allOf.length ? nested.allOf : undefined,
          },
        };
        break;
      }
      default:
        schema = { ...base, type: "string" };
    }

    properties[key] = schema;
    if (field.required && !isConditionControlled) {
      required.push(key);
    }

    const conditionBlock = buildJsonSchemaCondition(key, field.conditions);
    if (conditionBlock) {
      allOf.push(conditionBlock);
    }
  });

  return {
    properties,
    required: [...new Set(required)],
    allOf,
  };
}

export function buildSchema(form: FormDefinition): JsonSchemaDocument {
  const root = buildFieldCollection(form.fields);

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: form.title || "Untitled form",
    description: form.description || undefined,
    type: "object",
    properties: root.properties,
    required: root.required.length ? root.required : undefined,
    allOf: root.allOf.length ? root.allOf : undefined,
  };
}
