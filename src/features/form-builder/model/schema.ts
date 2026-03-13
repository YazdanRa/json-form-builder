import { resolveFieldKey, toSafeKey } from "./factories";
import type {
  FormDefinition,
  FormField,
  JsonSchemaCondition,
  JsonSchemaDocument,
  JsonSchemaNode,
} from "./types";

function getValidConditions(field: FormField) {
  return field.conditions.filter((condition) => condition.dependsOn && condition.equals !== "");
}

function buildConditionBlocks(key: string, field: FormField): JsonSchemaCondition[] {
  return getValidConditions(field).map((condition) => ({
    if: {
      properties: {
        [condition.dependsOn]: { const: condition.equals },
      },
      required: [condition.dependsOn],
    },
    then: {
      required: [key],
    },
  }));
}

function buildFieldCollection(fields: FormField[]) {
  const properties: Record<string, JsonSchemaNode> = {};
  const required: string[] = [];
  const allOf: JsonSchemaCondition[] = [];

  fields.forEach((field, index) => {
    if (field.type === "section") {
      const nested = buildFieldCollection(field.children);
      Object.assign(properties, nested.properties);
      required.push(...nested.required);
      allOf.push(...nested.allOf);
      return;
    }

    const key = resolveFieldKey(field, index);
    const base: JsonSchemaNode = {
      title: field.title || "Untitled question",
      description: field.description || undefined,
    };

    let schema: JsonSchemaNode = { ...base, type: "string" };

    switch (field.type) {
      case "string":
        schema = { ...base, type: "string", "x-placeholder": field.placeholder || undefined };
        break;
      case "textarea":
        schema = {
          ...base,
          type: "string",
          "x-ui": "textarea",
          "x-placeholder": field.placeholder || undefined,
        };
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
          "x-placeholder": field.placeholder || undefined,
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

    const validConditions = getValidConditions(field);
    if (validConditions.length) {
      schema["x-conditions"] = validConditions.map((condition) => ({
        dependsOn: condition.dependsOn,
        equals: condition.equals,
      }));
      allOf.push(...buildConditionBlocks(key, field));
    }

    properties[key] = schema;
    if (field.required) {
      required.push(key);
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
    "x-sections": form.fields
      .filter((field) => field.type === "section")
      .map((section) => ({
        key: toSafeKey(section.key || section.title, "section"),
        title: section.title,
        description: section.description,
        fields: section.children
          .filter((child) => child.type !== "section")
          .map((child, index) => resolveFieldKey(child, index)),
      })),
  };
}
