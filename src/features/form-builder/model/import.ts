import { normalizeFormDefinition } from "./normalization";
import type { ConditionRule, FieldType, FormDefinition, FormField } from "./types";

export type ImportFormDefinitionResult =
  | { ok: true; form: FormDefinition }
  | { ok: false; error: string };

type ImportFailure = { ok: false; error: string };
type Result<T> = { ok: true; value: T } | ImportFailure;
type SchemaConditionsByKey = Map<string, ConditionRule[]>;

const unsupportedSchemaKeys = ["oneOf", "anyOf", "not", "patternProperties", "prefixItems"] as const;

export function importFormDefinitionJson(input: string): ImportFormDefinitionResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input) as unknown;
  } catch {
    return {
      ok: false,
      error: "Pasted text is not valid JSON.",
    };
  }

  if (isDraftDefinition(parsed)) {
    return {
      ok: true,
      form: normalizeFormDefinition(parsed),
    };
  }

  if (looksLikeSchemaCandidate(parsed)) {
    return importJsonSchemaDefinition(parsed);
  }

  return {
    ok: false,
    error: "Pasted JSON must be a builder draft or supported JSON Schema.",
  };
}

function importJsonSchemaDefinition(input: unknown): ImportFormDefinitionResult {
  if (!isRecord(input) || input.type !== "object" || !isRecord(input.properties)) {
    return {
      ok: false,
      error: 'Root schema must be an object with "properties".',
    };
  }

  const unsupportedRootKey = getUnsupportedSchemaKey(input);
  if (unsupportedRootKey) {
    return {
      ok: false,
      error: `Unsupported schema construct "${unsupportedRootKey}" at "root".`,
    };
  }

  const requiredResult = getRequiredKeys(input.required, "root");
  if (!requiredResult.ok) {
    return requiredResult;
  }

  const conditionsResult = parseConditionalBlocks(input.allOf, "allOf");
  if (!conditionsResult.ok) {
    return conditionsResult;
  }

  const fieldsResult = convertPropertiesToFields(input.properties, {
    path: "",
    requiredKeys: requiredResult.value,
    conditionsByKey: conditionsResult.value,
  });
  if (!fieldsResult.ok) {
    return fieldsResult;
  }

  return {
    ok: true,
    form: {
      title: typeof input.title === "string" && input.title.trim() ? input.title : "Untitled form",
      description: typeof input.description === "string" ? input.description : "",
      fields: fieldsResult.value,
    },
  };
}

function convertPropertiesToFields(
  properties: Record<string, unknown>,
  context: {
    path: string;
    requiredKeys: Set<string>;
    conditionsByKey: SchemaConditionsByKey;
  },
): Result<FormField[]> {
  const fields: FormField[] = [];

  for (const [key, rawNode] of Object.entries(properties)) {
    const fieldResult = convertSchemaNodeToField(key, rawNode, context);
    if (!fieldResult.ok) {
      return fieldResult;
    }

    fields.push(fieldResult.value);
  }

  return {
    ok: true,
    value: fields,
  };
}

function convertSchemaNodeToField(
  key: string,
  rawNode: unknown,
  context: {
    path: string;
    requiredKeys: Set<string>;
    conditionsByKey: SchemaConditionsByKey;
  },
): Result<FormField> {
  if (!isRecord(rawNode)) {
    return {
      ok: false,
      error: `Unsupported schema node at "${formatPath(context.path, key)}".`,
    };
  }

  const path = formatPath(context.path, key);
  const unsupportedKey = getUnsupportedSchemaKey(rawNode);
  if (unsupportedKey) {
    return {
      ok: false,
      error: `Unsupported schema construct "${unsupportedKey}" at "${path}".`,
    };
  }

  const conditions = context.conditionsByKey.get(key) ?? [];
  const baseField: Omit<FormField, "type" | "options" | "children"> = {
    id: crypto.randomUUID(),
    key,
    title: typeof rawNode.title === "string" && rawNode.title.trim() ? rawNode.title : humanizeKey(key),
    description: typeof rawNode.description === "string" ? rawNode.description : "",
    required: context.requiredKeys.has(key) && conditions.length === 0,
    conditions,
  };

  if (Array.isArray(rawNode.enum)) {
    if (!rawNode.enum.every((option) => typeof option === "string")) {
      return {
        ok: false,
        error: `Unsupported enum values at "${path}".`,
      };
    }

    return {
      ok: true,
      value: {
        ...baseField,
        type: "enum",
        options: [...rawNode.enum],
        children: [],
      },
    };
  }

  switch (rawNode.type) {
    case "string": {
      const stringType = getStringFieldType(rawNode.format, path);
      if (!stringType.ok) {
        return stringType;
      }

      return {
        ok: true,
        value: {
          ...baseField,
          type: stringType.value,
          options: [],
          children: [],
        },
      };
    }
    case "number":
    case "integer":
    case "boolean":
      return {
        ok: true,
        value: {
          ...baseField,
          type: rawNode.type,
          options: [],
          children: [],
        },
      };
    case "object": {
      if (!isRecord(rawNode.properties)) {
        return {
          ok: false,
          error: `Unsupported schema node at "${path}".`,
        };
      }

      const requiredResult = getRequiredKeys(rawNode.required, path);
      if (!requiredResult.ok) {
        return requiredResult;
      }

      const conditionsResult = parseConditionalBlocks(rawNode.allOf, `${path}.allOf`);
      if (!conditionsResult.ok) {
        return conditionsResult;
      }

      const childrenResult = convertPropertiesToFields(rawNode.properties, {
        path,
        requiredKeys: requiredResult.value,
        conditionsByKey: conditionsResult.value,
      });
      if (!childrenResult.ok) {
        return childrenResult;
      }

      return {
        ok: true,
        value: {
          ...baseField,
          type: "object",
          options: [],
          children: childrenResult.value,
        },
      };
    }
    case "array": {
      if (!isRecord(rawNode.items)) {
        return {
          ok: false,
          error: `Unsupported array item shape at "${path}".`,
        };
      }

      if (rawNode.items.type === "string") {
        return {
          ok: true,
          value: {
            ...baseField,
            type: "array_string",
            options: [],
            children: [],
          },
        };
      }

      if (rawNode.items.type !== "object" || !isRecord(rawNode.items.properties)) {
        return {
          ok: false,
          error: `Unsupported array item shape at "${path}".`,
        };
      }

      const requiredResult = getRequiredKeys(rawNode.items.required, `${path}[]`);
      if (!requiredResult.ok) {
        return requiredResult;
      }

      const conditionsResult = parseConditionalBlocks(rawNode.items.allOf, `${path}[].allOf`);
      if (!conditionsResult.ok) {
        return conditionsResult;
      }

      const childrenResult = convertPropertiesToFields(rawNode.items.properties, {
        path: `${path}[]`,
        requiredKeys: requiredResult.value,
        conditionsByKey: conditionsResult.value,
      });
      if (!childrenResult.ok) {
        return childrenResult;
      }

      return {
        ok: true,
        value: {
          ...baseField,
          type: "array_object",
          options: [],
          children: childrenResult.value,
        },
      };
    }
    default:
      return {
        ok: false,
        error: `Unsupported schema node at "${path}".`,
      };
  }
}

function parseConditionalBlocks(allOf: unknown, path: string): Result<SchemaConditionsByKey> {
  const conditionsByKey = new Map<string, ConditionRule[]>();
  if (allOf === undefined) {
    return {
      ok: true,
      value: conditionsByKey,
    };
  }

  if (!Array.isArray(allOf)) {
    return {
      ok: false,
      error: `Unsupported conditional branch at "${path}".`,
    };
  }

  for (const [index, branch] of allOf.entries()) {
    if (!isRecord(branch) || !isRecord(branch.if) || !isRecord(branch.then)) {
      return {
        ok: false,
        error: `Unsupported conditional branch at "${path}[${index}]".`,
      };
    }

    if (!isRecord(branch.if.properties) || !Array.isArray(branch.if.required) || !Array.isArray(branch.then.required)) {
      return {
        ok: false,
        error: `Unsupported conditional branch at "${path}[${index}]".`,
      };
    }

    if (branch.then.required.length === 0 || !branch.then.required.every((value) => typeof value === "string")) {
      return {
        ok: false,
        error: `Unsupported conditional branch at "${path}[${index}]".`,
      };
    }

    const dependencyKeys = Object.keys(branch.if.properties);
    if (
      dependencyKeys.length === 0 ||
      dependencyKeys.length !== branch.if.required.length ||
      !branch.if.required.every((value) => typeof value === "string" && dependencyKeys.includes(value))
    ) {
      return {
        ok: false,
        error: `Unsupported conditional branch at "${path}[${index}]".`,
      };
    }

    const conditions: ConditionRule[] = [];
    const groupId = crypto.randomUUID();
    for (const dependencyKey of dependencyKeys) {
      const dependencyNode = branch.if.properties[dependencyKey];
      if (!isRecord(dependencyNode)) {
        return {
          ok: false,
          error: `Unsupported conditional branch at "${path}[${index}]".`,
        };
      }

      const condition = parseDependencyCondition(dependencyKey, dependencyNode, groupId);
      if (!condition.ok) {
        return {
          ok: false,
          error: `Unsupported conditional branch at "${path}[${index}]".`,
        };
      }

      conditions.push(condition.value);
    }

    const targetKeys = [...new Set(branch.then.required)];
    for (const targetKey of targetKeys) {
      if (typeof targetKey !== "string") {
        return {
          ok: false,
          error: `Unsupported conditional branch at "${path}[${index}]".`,
        };
      }

      conditionsByKey.set(targetKey, [...(conditionsByKey.get(targetKey) ?? []), ...cloneConditionGroup(conditions)]);
    }
  }

  return {
    ok: true,
    value: conditionsByKey,
  };
}

function parseDependencyCondition(key: string, node: Record<string, unknown>, groupId: string): Result<ConditionRule> {
  if ("const" in node) {
    if (typeof node.const !== "string" && typeof node.const !== "number" && typeof node.const !== "boolean") {
      return {
        ok: false,
        error: `Unsupported conditional branch for "${key}".`,
      };
    }

    return {
      ok: true,
      value: {
        id: crypto.randomUUID(),
        groupId,
        dependsOn: key,
        operator: "equals",
        value: String(node.const),
        values: [],
      },
    };
  }

  if ("enum" in node) {
    if (!Array.isArray(node.enum) || !node.enum.every((value) => typeof value === "string")) {
      return {
        ok: false,
        error: `Unsupported conditional branch for "${key}".`,
      };
    }

    return {
      ok: true,
      value: {
        id: crypto.randomUUID(),
        groupId,
        dependsOn: key,
        operator: "one_of",
        value: "",
        values: [...node.enum],
      },
    };
  }

  if (Object.keys(node).length === 0) {
    return {
      ok: true,
      value: {
        id: crypto.randomUUID(),
        groupId,
        dependsOn: key,
        operator: "present",
        value: "",
        values: [],
      },
    };
  }

  return {
    ok: false,
    error: `Unsupported conditional branch for "${key}".`,
  };
}

function cloneConditionGroup(conditions: ConditionRule[]) {
  return conditions.map((condition) => ({
    id: crypto.randomUUID(),
    groupId: condition.groupId,
    dependsOn: condition.dependsOn,
    operator: condition.operator,
    value: condition.value,
    values: [...condition.values],
  }));
}

function getRequiredKeys(required: unknown, path: string): Result<Set<string>> {
  if (required === undefined) {
    return {
      ok: true,
      value: new Set<string>(),
    };
  }

  if (!Array.isArray(required) || !required.every((value) => typeof value === "string")) {
    return {
      ok: false,
      error: `Unsupported required list at "${path}".`,
    };
  }

  return {
    ok: true,
    value: new Set(required),
  };
}

function getStringFieldType(format: unknown, path: string): Result<Extract<FieldType, "string" | "email" | "date">> {
  if (format === undefined) {
    return {
      ok: true,
      value: "string",
    };
  }

  if (format === "email" || format === "date") {
    return {
      ok: true,
      value: format,
    };
  }

  return {
    ok: false,
    error: `Unsupported string format "${String(format)}" at "${path}".`,
  };
}

function isDraftDefinition(value: unknown): value is FormDefinition {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.fields)
  );
}

function looksLikeSchemaCandidate(value: unknown) {
  return isRecord(value) && ("$schema" in value || "type" in value || "properties" in value);
}

function getUnsupportedSchemaKey(node: Record<string, unknown>) {
  return unsupportedSchemaKeys.find((key) => key in node) ?? null;
}

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatPath(parentPath: string, key: string) {
  return parentPath ? `${parentPath}.${key}` : key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
