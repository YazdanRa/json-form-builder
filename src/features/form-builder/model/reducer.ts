import { createField } from "./factories";
import { addChildFieldToTree, moveFieldInTree, removeFieldFromTree, updateFieldTree } from "./tree";
import type { FieldType, FormDefinition, FormField } from "./types";

export type FormBuilderAction =
  | { type: "hydrate"; form: FormDefinition }
  | { type: "reset"; form: FormDefinition }
  | { type: "update_meta"; patch: Partial<Pick<FormDefinition, "title" | "description">> }
  | { type: "add_field"; fieldType?: FieldType }
  | { type: "update_field"; fieldId: string; patch: Partial<FormField> }
  | { type: "remove_field"; fieldId: string }
  | { type: "move_field"; fieldId: string; direction: -1 | 1 }
  | { type: "add_child_field"; parentId: string; fieldType?: FieldType };

export function formBuilderReducer(state: FormDefinition, action: FormBuilderAction): FormDefinition {
  switch (action.type) {
    case "hydrate":
    case "reset":
      return action.form;
    case "update_meta":
      return { ...state, ...action.patch };
    case "add_field":
      return { ...state, fields: [...state.fields, createField(action.fieldType)] };
    case "update_field":
      return {
        ...state,
        fields: updateFieldTree(state.fields, action.fieldId, (field) => ({ ...field, ...action.patch })),
      };
    case "remove_field":
      return { ...state, fields: removeFieldFromTree(state.fields, action.fieldId) };
    case "move_field":
      return { ...state, fields: moveFieldInTree(state.fields, action.fieldId, action.direction) };
    case "add_child_field":
      return {
        ...state,
        fields: addChildFieldToTree(state.fields, action.parentId, action.fieldType),
      };
    default:
      return state;
  }
}
