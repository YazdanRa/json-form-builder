import type { ConditionRule, JsonSchemaCondition } from "./types";

export function createConditionRule(groupId: string = crypto.randomUUID()): ConditionRule {
  return {
    id: crypto.randomUUID(),
    groupId,
    dependsOn: "",
    operator: "equals",
    value: "",
    values: [],
  };
}

export function createConditionGroupId(): string {
  return crypto.randomUUID();
}

function getConfiguredValues(values: string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function isConditionConfigured(condition: ConditionRule) {
  if (!condition.dependsOn) {
    return false;
  }

  if (condition.operator === "present") {
    return true;
  }

  if (condition.operator === "one_of") {
    return getConfiguredValues(condition.values).length > 0;
  }

  return condition.value.trim() !== "";
}

export function getValidConditionGroups(conditions: ConditionRule[] | undefined): ConditionRule[][] {
  const grouped = new Map<string, ConditionRule[]>();
  for (const condition of conditions ?? []) {
    const groupId = condition.groupId || condition.id;
    grouped.set(groupId, [...(grouped.get(groupId) ?? []), condition]);
  }

  return [...grouped.values()].filter((group) => group.length > 0 && group.every(isConditionConfigured));
}

function toComparableValue(value: unknown) {
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  return typeof value === "string" ? value : "";
}

function hasComparableValue(value: unknown) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return typeof value === "object" ? Object.keys(value).length > 0 : false;
}

export function areConditionsSatisfied(
  conditions: ConditionRule[] | undefined,
  scopeValues: Record<string, unknown>,
): boolean {
  const validGroups = getValidConditionGroups(conditions);
  if (!validGroups.length) {
    return true;
  }

  return validGroups.some((group) =>
    group.every((condition) => {
      const currentValue = scopeValues[condition.dependsOn];
      if (condition.operator === "present") {
        return hasComparableValue(currentValue);
      }

      if (condition.operator === "one_of") {
        return getConfiguredValues(condition.values).includes(toComparableValue(currentValue));
      }

      return toComparableValue(currentValue) === condition.value;
    }),
  );
}

export function buildJsonSchemaConditions(key: string, conditions: ConditionRule[] | undefined): JsonSchemaCondition[] {
  return getValidConditionGroups(conditions).map((group) => ({
    if: {
      properties: Object.fromEntries(
        group.map((condition) => {
          if (condition.operator === "present") {
            return [condition.dependsOn, {}];
          }

          if (condition.operator === "one_of") {
            return [condition.dependsOn, { enum: getConfiguredValues(condition.values) }];
          }

          return [condition.dependsOn, { const: condition.value }];
        }),
      ),
      required: [...new Set(group.map((condition) => condition.dependsOn))],
    },
    then: {
      required: [key],
    },
  }));
}
