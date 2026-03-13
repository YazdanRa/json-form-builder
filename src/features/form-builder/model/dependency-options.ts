import { toSafeKey } from "./factories";
import type { DependencyOption, FormField } from "./types";

export function getFlatDependencyOptions(fields: FormField[], parentPrefix = ""): DependencyOption[] {
  const result: DependencyOption[] = [];

  fields.forEach((field) => {
    if (field.type === "section") {
      result.push(...getFlatDependencyOptions(field.children, parentPrefix));
      return;
    }

    const key = toSafeKey(field.key || field.title || field.id);
    const path = parentPrefix ? `${parentPrefix}.${key}` : key;
    result.push({
      id: field.id,
      label: field.title || key,
      key,
      path,
      type: field.type,
    });
  });

  return result;
}
