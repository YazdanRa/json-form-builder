import { createField } from "./factories";
import type { FieldType, FormField } from "./types";

export function updateFieldTree(
  fields: FormField[],
  targetId: string,
  updater: (field: FormField) => FormField,
): FormField[] {
  let changed = false;

  const next = fields.map((field) => {
    if (field.id === targetId) {
      changed = true;
      return updater(field);
    }

    if (!field.children.length) {
      return field;
    }

    const nextChildren = updateFieldTree(field.children, targetId, updater);
    if (nextChildren !== field.children) {
      changed = true;
      return { ...field, children: nextChildren };
    }

    return field;
  });

  return changed ? next : fields;
}

export function removeFieldFromTree(fields: FormField[], targetId: string): FormField[] {
  let changed = false;

  const next = fields
    .filter((field) => {
      const keep = field.id !== targetId;
      if (!keep) {
        changed = true;
      }
      return keep;
    })
    .map((field) => {
      if (!field.children.length) {
        return field;
      }

      const nextChildren = removeFieldFromTree(field.children, targetId);
      if (nextChildren !== field.children) {
        changed = true;
        return { ...field, children: nextChildren };
      }

      return field;
    });

  return changed ? next : fields;
}

export function moveFieldInTree(fields: FormField[], targetId: string, direction: -1 | 1): FormField[] {
  const index = fields.findIndex((field) => field.id === targetId);
  if (index >= 0) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) {
      return fields;
    }

    const next = [...fields];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  }

  let changed = false;
  const next = fields.map((field) => {
    if (!field.children.length) {
      return field;
    }

    const nextChildren = moveFieldInTree(field.children, targetId, direction);
    if (nextChildren !== field.children) {
      changed = true;
      return { ...field, children: nextChildren };
    }

    return field;
  });

  return changed ? next : fields;
}

export function addChildFieldToTree(
  fields: FormField[],
  parentId: string,
  fieldType: FieldType = "string",
): FormField[] {
  let changed = false;

  const next = fields.map((field) => {
    if (field.id === parentId) {
      changed = true;
      return { ...field, children: [...field.children, createField(fieldType)] };
    }

    if (!field.children.length) {
      return field;
    }

    const nextChildren = addChildFieldToTree(field.children, parentId, fieldType);
    if (nextChildren !== field.children) {
      changed = true;
      return { ...field, children: nextChildren };
    }

    return field;
  });

  return changed ? next : fields;
}
