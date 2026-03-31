import { createInitialFormDefinition } from "./factories";
import type { ConditionOperator, FieldType, FormDefinition, FormField } from "./types";

type LegacyFieldType = FieldType | "section";

interface LegacyFormField extends Omit<FormField, "type" | "children"> {
  type: LegacyFieldType;
  children: LegacyFormField[];
}

interface LegacyFormDefinition extends Omit<FormDefinition, "fields"> {
  fields: LegacyFormField[];
}

interface LegacyConditionRule {
  id?: string;
  groupId?: string;
  dependsOn?: string;
  operator?: ConditionOperator;
  value?: string;
  values?: string[];
  equals?: string;
}

function normalizeCondition(condition: LegacyConditionRule, fallbackGroupId: string) {
  const operator = condition.operator ?? "equals";

  return {
    id: typeof condition.id === "string" && condition.id ? condition.id : crypto.randomUUID(),
    groupId: typeof condition.groupId === "string" && condition.groupId ? condition.groupId : fallbackGroupId,
    dependsOn: typeof condition.dependsOn === "string" ? condition.dependsOn : "",
    operator,
    value:
      typeof condition.value === "string"
        ? condition.value
        : typeof condition.equals === "string"
          ? condition.equals
          : "",
    values: Array.isArray(condition.values) ? condition.values.filter((value): value is string => typeof value === "string") : [],
  };
}

function normalizeField(field: LegacyFormField): FormField {
  const rawField = field as LegacyFormField & { placeholder?: unknown };
  const fallbackGroupId = crypto.randomUUID();

  return {
    id: rawField.id,
    key: rawField.key,
    title: rawField.title,
    description: rawField.description,
    type: rawField.type === "section" ? "object" : rawField.type,
    required: rawField.required,
    options: Array.isArray(rawField.options) ? rawField.options : [],
    children: Array.isArray(rawField.children) ? rawField.children.map(normalizeField) : [],
    conditions: Array.isArray(rawField.conditions)
      ? rawField.conditions.map((condition) => normalizeCondition(condition as LegacyConditionRule, fallbackGroupId))
      : [],
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
