import type { ConditionRule, JsonSchemaCondition } from "./types";

export function createConditionRule(): ConditionRule {
  return {
    id: crypto.randomUUID(),
    dependsOn: "",
    equals: "",
  };
}

export function getValidConditions(conditions: ConditionRule[] | undefined): ConditionRule[] {
  return (conditions ?? []).filter((condition) => condition.dependsOn && condition.equals !== "");
}

function toComparableValue(value: unknown) {
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  return typeof value === "string" ? value : "";
}

export function areConditionsSatisfied(
  conditions: ConditionRule[] | undefined,
  scopeValues: Record<string, unknown>,
): boolean {
  const validConditions = getValidConditions(conditions);
  if (!validConditions.length) {
    return true;
  }

  return validConditions.every(
    (condition) => toComparableValue(scopeValues[condition.dependsOn]) === condition.equals,
  );
}

export function buildJsonSchemaCondition(key: string, conditions: ConditionRule[] | undefined): JsonSchemaCondition | null {
  const validConditions = getValidConditions(conditions);
  if (!validConditions.length) {
    return null;
  }

  return {
    if: {
      properties: Object.fromEntries(validConditions.map((condition) => [condition.dependsOn, { const: condition.equals }])),
      required: [...new Set(validConditions.map((condition) => condition.dependsOn))],
    },
    then: {
      required: [key],
    },
  };
}
