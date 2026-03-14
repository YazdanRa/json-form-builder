import { createInitialFormDefinition } from "./factories";
import type { FieldType, FormDefinition, FormField } from "./types";

type LegacyFieldType = FieldType | "section";

interface LegacyFormField extends Omit<FormField, "type" | "children"> {
  type: LegacyFieldType;
  children: LegacyFormField[];
}

interface LegacyFormDefinition extends Omit<FormDefinition, "fields"> {
  fields: LegacyFormField[];
}

function normalizeField(field: LegacyFormField): FormField {
  return {
    ...field,
    type: field.type === "section" ? "object" : field.type,
    children: Array.isArray(field.children) ? field.children.map(normalizeField) : [],
    conditions: Array.isArray(field.conditions) ? field.conditions : [],
  };
}

export function normalizeFormDefinition(input: unknown): FormDefinition {
  if (!input || typeof input !== "object") {
    return createInitialFormDefinition();
  }

  const candidate = input as Partial<LegacyFormDefinition>;
  if (typeof candidate.title !== "string" || typeof candidate.description !== "string" || !Array.isArray(candidate.fields)) {
    return createInitialFormDefinition();
  }

  return {
    title: candidate.title,
    description: candidate.description,
    fields: candidate.fields.map((field) => normalizeField(field as LegacyFormField)),
  };
}
