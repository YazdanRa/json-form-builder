export type FieldType =
  | "string"
  | "textarea"
  | "number"
  | "integer"
  | "boolean"
  | "email"
  | "date"
  | "enum"
  | "object"
  | "array_string"
  | "array_object";

export type ConditionOperator = "equals" | "present" | "one_of";

export interface ConditionRule {
  id: string;
  groupId: string;
  dependsOn: string;
  operator: ConditionOperator;
  value: string;
  values: string[];
}

export interface FormField {
  id: string;
  key: string;
  title: string;
  description: string;
  type: FieldType;
  required: boolean;
  options: string[];
  children: FormField[];
  conditions: ConditionRule[];
}

export interface FormDefinition {
  title: string;
  description: string;
  fields: FormField[];
}

export interface DependencyOption {
  id: string;
  label: string;
  key: string;
  path: string;
  type: FieldType;
}

export interface ValidationIssue {
  fieldId: string;
  key: string;
  scopePath: string;
  message: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  issuesByField: Record<string, ValidationIssue[]>;
  hasBlockingIssues: boolean;
}

export interface JsonSchemaCondition {
  if: {
    properties: Record<string, { const?: string; enum?: string[] }>;
    required: string[];
  };
  then: {
    required: string[];
  };
}

export interface JsonSchemaNode {
  title?: string;
  description?: string;
  type?: string;
  format?: string;
  enum?: string[];
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode;
  allOf?: JsonSchemaCondition[];
}

export interface JsonSchemaDocument extends JsonSchemaNode {
  $schema: string;
  title: string;
  description?: string;
  type: "object";
  properties: Record<string, JsonSchemaNode>;
}
