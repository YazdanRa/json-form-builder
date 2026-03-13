import { resolveFieldKey } from "./factories";
import type { FormDefinition, FormField, ValidationIssue, ValidationResult } from "./types";

function flattenScopeFields(fields: FormField[]): Array<{ field: FormField; index: number }> {
  return fields.map((field, index) => ({ field, index }));
}

function validateCollection(fields: FormField[], scopePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byKey = new Map<string, FormField[]>();

  flattenScopeFields(fields).forEach(({ field, index }) => {
    const resolvedKey = resolveFieldKey(field, index);
    byKey.set(resolvedKey, [...(byKey.get(resolvedKey) ?? []), field]);

    if (field.type === "object" || field.type === "array_object") {
      const nextScopePath = scopePath === "root" ? resolvedKey : `${scopePath}.${resolvedKey}`;
      issues.push(...validateCollection(field.children, nextScopePath));
    }
  });

  byKey.forEach((matchingFields, key) => {
    if (matchingFields.length < 2) {
      return;
    }

    matchingFields.forEach((field) => {
      issues.push({
        fieldId: field.id,
        key,
        scopePath,
        message: `Resolved key "${key}" is duplicated in ${scopePath === "root" ? "the root scope" : `"${scopePath}"`}.`,
      });
    });
  });

  return issues;
}

export function validateFormDefinition(form: FormDefinition): ValidationResult {
  const issues = validateCollection(form.fields, "root");
  const issuesByField = issues.reduce<Record<string, ValidationIssue[]>>((acc, issue) => {
    acc[issue.fieldId] = [...(acc[issue.fieldId] ?? []), issue];
    return acc;
  }, {});

  return {
    issues,
    issuesByField,
    hasBlockingIssues: issues.length > 0,
  };
}
