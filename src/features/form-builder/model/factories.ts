import type { FieldType, FormDefinition, FormField } from "./types";

export const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: "string", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
  { value: "boolean", label: "Yes / No" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "enum", label: "Multiple choice" },
  { value: "object", label: "Nested object" },
  { value: "array_string", label: "List of text" },
  { value: "array_object", label: "List of objects" },
  { value: "section", label: "Section" },
];

const containerFieldTypes = new Set<FieldType>(["object", "array_object", "section"]);
const placeholderFieldTypes = new Set<FieldType>(["string", "textarea", "email", "array_string"]);

export function toSafeKey(input: string, fallback = "field") {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || fallback
  );
}

export function resolveFieldKey(field: Pick<FormField, "key" | "title">, index: number) {
  return toSafeKey(field.key || field.title, `field_${index + 1}`);
}

export function createConditionRule() {
  return {
    id: crypto.randomUUID(),
    dependsOn: "",
    equals: "",
  };
}

export function supportsChildren(type: FieldType) {
  return containerFieldTypes.has(type);
}

export function supportsPlaceholder(type: FieldType) {
  return placeholderFieldTypes.has(type);
}

export function supportsOptions(type: FieldType) {
  return type === "enum";
}

export function createField(type: FieldType = "string"): FormField {
  return {
    id: crypto.randomUUID(),
    key: "",
    title: type === "section" ? "Untitled section" : "Untitled question",
    description: "",
    type,
    required: false,
    placeholder: "",
    options: type === "enum" ? ["Option 1", "Option 2"] : [],
    children: supportsChildren(type) ? [createField("string")] : [],
    conditions: [],
  };
}

export function createTypeChangePatch(field: FormField, type: FieldType): Partial<FormField> {
  return {
    type,
    children: supportsChildren(type)
      ? field.children.length
        ? field.children
        : [createField("string")]
      : [],
    options:
      type === "enum" ? (field.options.length ? field.options : ["Option 1", "Option 2"]) : field.options,
    placeholder: supportsPlaceholder(type) ? field.placeholder : "",
  };
}

export function createInitialFormDefinition(): FormDefinition {
  return {
    title: "Project Intake Form",
    description: "Collect a few basic details and export them as JSON Schema.",
    fields: [
      {
        id: crypto.randomUUID(),
        key: "contact_section",
        title: "Contact Details",
        description: "Basic information about the requester.",
        type: "section",
        required: false,
        placeholder: "",
        options: [],
        conditions: [],
        children: [
          {
            id: crypto.randomUUID(),
            key: "full_name",
            title: "Full Name",
            description: "Name of the requester",
            type: "string",
            required: true,
            placeholder: "John Appleseed",
            options: [],
            children: [],
            conditions: [],
          },
          {
            id: crypto.randomUUID(),
            key: "email",
            title: "Email",
            description: "Primary contact email",
            type: "email",
            required: true,
            placeholder: "name@company.com",
            options: [],
            children: [],
            conditions: [],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        key: "request_type",
        title: "Request Type",
        description: "Select the kind of request",
        type: "enum",
        required: true,
        placeholder: "",
        options: ["Bug", "Feature", "Support"],
        children: [],
        conditions: [],
      },
      {
        id: crypto.randomUUID(),
        key: "bug_details",
        title: "Bug Details",
        description: "Shown only for bug reports",
        type: "object",
        required: false,
        placeholder: "",
        options: [],
        conditions: [{ id: crypto.randomUUID(), dependsOn: "request_type", equals: "Bug" }],
        children: [
          {
            id: crypto.randomUUID(),
            key: "severity",
            title: "Severity",
            description: "",
            type: "enum",
            required: true,
            placeholder: "",
            options: ["Low", "Medium", "High"],
            children: [],
            conditions: [],
          },
          {
            id: crypto.randomUUID(),
            key: "steps",
            title: "Steps to Reproduce",
            description: "",
            type: "textarea",
            required: false,
            placeholder: "Describe the steps",
            options: [],
            children: [],
            conditions: [],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        key: "links",
        title: "Related Links",
        description: "A simple list of text items",
        type: "array_string",
        required: false,
        placeholder: "https://...",
        options: [],
        children: [],
        conditions: [],
      },
      {
        id: crypto.randomUUID(),
        key: "team_members",
        title: "Team Members",
        description: "A list of nested object items",
        type: "array_object",
        required: false,
        placeholder: "",
        options: [],
        conditions: [],
        children: [
          {
            id: crypto.randomUUID(),
            key: "name",
            title: "Name",
            description: "",
            type: "string",
            required: true,
            placeholder: "",
            options: [],
            children: [],
            conditions: [],
          },
          {
            id: crypto.randomUUID(),
            key: "role",
            title: "Role",
            description: "",
            type: "string",
            required: false,
            placeholder: "",
            options: [],
            children: [],
            conditions: [],
          },
        ],
      },
    ],
  };
}
