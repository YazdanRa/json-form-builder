import { toSafeKey } from "./factories";
import type { DependencyOption, FormField } from "./types";

export function getFlatDependencyOptions(fields: FormField[], parentPrefix = ""): DependencyOption[] {
  return fields.map((field) => {
    const key = toSafeKey(field.key || field.title || field.id);
    const path = parentPrefix ? `${parentPrefix}.${key}` : key;

    return {
      id: field.id,
      label: field.title || key,
      key,
      path,
      type: field.type,
    };
  });
}
