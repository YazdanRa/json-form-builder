import { useState } from "react";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  FIELD_TYPES,
  createConditionRule,
  createField,
  createTypeChangePatch,
  getFlatDependencyOptions,
  supportsChildren,
  supportsOptions,
  type FormField,
  type ValidationIssue,
} from "@/features/form-builder/model";
import { cn } from "@/lib/utils";

interface FieldEditorProps {
  field: FormField;
  scopeFields: FormField[];
  issuesByField: Record<string, ValidationIssue[]>;
  depth?: number;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddChild: () => void;
}

export function FieldEditor({
  field,
  scopeFields,
  issuesByField,
  depth = 0,
  onChange,
  onRemove,
  onMove,
  onAddChild,
}: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const optionsEnabled = supportsOptions(field.type);
  const nestedEnabled = supportsChildren(field.type);
  const dependencyOptions = getFlatDependencyOptions(scopeFields).filter((option) => option.id !== field.id);
  const issues = issuesByField[field.id] ?? [];
  const isConditionControlled = field.conditions.length > 0;
  const fieldLabel = field.title.trim() || field.key.trim() || "Untitled field";
  const panelId = `field-${field.id}-panel`;

  const titleInputId = `field-${field.id}-title`;
  const keyInputId = `field-${field.id}-key`;
  const descriptionInputId = `field-${field.id}-description`;
  const typeInputId = `field-${field.id}-type`;

  return (
    <Card
      className="rounded-[26px] border-slate-300/75 bg-white/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_6px_20px_rgba(15,23,42,0.06)]"
      data-testid={`${depth === 0 ? "root" : "nested"}-field-editor-${field.id}`}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-3 rounded-[20px] border border-transparent px-1 py-1 text-left transition-colors hover:bg-muted/38 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${fieldLabel}`}
            onClick={() => setIsExpanded((current) => !current)}
          >
            <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="text-[1.05rem] font-semibold text-foreground">{fieldLabel}</div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                <span className="rounded-full border border-border/80 bg-white/82 px-2.5 py-1">
                  {field.type.replaceAll("_", " ")}
                </span>
                <span className="rounded-full border border-border/80 bg-white/82 px-2.5 py-1">
                  {field.key.trim() ? `Key: ${field.key.trim()}` : "Key: auto-generated"}
                </span>
                {nestedEnabled ? (
                  <span className="rounded-full border border-border/80 bg-white/82 px-2.5 py-1">
                    {field.children.length} nested field{field.children.length === 1 ? "" : "s"}
                  </span>
                ) : null}
                {field.conditions.length ? (
                  <span className="rounded-full border border-border/80 bg-white/82 px-2.5 py-1">
                    {field.conditions.length} condition{field.conditions.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>
            <ChevronDown
              className={cn("mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform", !isExpanded && "-rotate-90")}
            />
          </button>
          <div className="flex shrink-0 gap-2 self-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMove(-1)}
              aria-label={`Move ${field.title || field.type} up`}
            >
              ↑
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMove(1)}
              aria-label={`Move ${field.title || field.type} down`}
            >
              ↓
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRemove}
              aria-label={`Remove ${field.title || field.type}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {issues.length ? (
          <div className="space-y-1 rounded-[18px] bg-[rgba(255,59,48,0.08)] px-3 py-2 text-xs text-destructive">
            {issues.map((issue) => (
              <p key={`${field.id}-${issue.key}`}>{issue.message}</p>
            ))}
          </div>
        ) : null}

        {isExpanded ? (
          <div id={panelId} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={titleInputId}>Label</Label>
                <Input
                  id={titleInputId}
                  value={field.title}
                  onChange={(event) => onChange({ title: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={keyInputId}>Key</Label>
                <Input
                  id={keyInputId}
                  value={field.key}
                  onChange={(event) => onChange({ key: event.target.value })}
                  placeholder="auto-generated if empty"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={typeInputId}>Type</Label>
                <Select value={field.type} onValueChange={(value) => onChange(createTypeChangePatch(field, value as typeof field.type))}>
                  <SelectTrigger id={typeInputId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={descriptionInputId}>Description</Label>
                <Textarea
                  id={descriptionInputId}
                  value={field.description}
                  onChange={(event) => onChange({ description: event.target.value })}
                  placeholder="Optional helper copy"
                  className="min-h-[96px]"
                />
              </div>
            </div>

            {optionsEnabled ? (
              <div className="space-y-3 rounded-[22px] border border-slate-300/70 bg-muted/60 p-3">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange({ options: [...field.options, `Option ${field.options.length + 1}`] })}
                  >
                    <Plus className="h-4 w-4" /> Add option
                  </Button>
                </div>
                <div className="space-y-2">
                  {field.options.map((option, optionIndex) => (
                    <div key={`${field.id}-option-${optionIndex}`} className="flex gap-2">
                      <Input
                        aria-label={`Option ${optionIndex + 1}`}
                        value={option}
                        onChange={(event) => {
                          const next = [...field.options];
                          next[optionIndex] = event.target.value;
                          onChange({ options: next });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remove option ${optionIndex + 1}`}
                        onClick={() => {
                          const next = field.options.filter((_, index) => index !== optionIndex);
                          onChange({ options: next.length ? next : ["Option 1"] });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-[22px] bg-muted/72 p-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={!isConditionControlled && field.required}
                  disabled={isConditionControlled}
                  onCheckedChange={(checked) => onChange({ required: checked })}
                />
                <div>
                  <div className="text-sm font-semibold">Always Required</div>
                  <div className="text-xs text-muted-foreground">
                    {isConditionControlled
                      ? "Disabled because conditional fields are required by their active branch, not unconditionally."
                      : "Adds the field key to the schema `required` array unconditionally."}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-[22px] border border-slate-300/70 bg-white/82 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Conditional visibility</div>
                  <div className="text-xs text-muted-foreground">
                    Promote this field into a native JSON Schema `if` / `then` branch when another field equals a value.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ conditions: [...field.conditions, createConditionRule()], required: false })}
                >
                  <Plus className="h-4 w-4" /> Add rule
                </Button>
              </div>

              {field.conditions.length ? (
                <div className="space-y-2">
                  {field.conditions.map((condition, index) => (
                    <div key={condition.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <Select
                        value={condition.dependsOn || "__none__"}
                        onValueChange={(value) => {
                          const next = [...field.conditions];
                          next[index] = { ...condition, dependsOn: value === "__none__" ? "" : value };
                          onChange({ conditions: next, required: false });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Depends on" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select field</SelectItem>
                          {dependencyOptions.map((option) => (
                            <SelectItem key={option.id} value={option.key}>
                              {option.path}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        aria-label={`Condition ${index + 1} equals`}
                        value={condition.equals}
                        onChange={(event) => {
                          const next = [...field.conditions];
                          next[index] = { ...condition, equals: event.target.value };
                          onChange({ conditions: next, required: false });
                        }}
                        placeholder="Equals"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remove condition ${index + 1}`}
                        onClick={() =>
                          onChange({
                            conditions: field.conditions.filter((_, conditionIndex) => conditionIndex !== index),
                            required: false,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {nestedEnabled ? (
              <div className="space-y-3 rounded-[22px] border border-slate-300/70 bg-white/82 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Nested fields</div>
                    <div className="text-xs text-muted-foreground">
                      {field.type === "object" ? "Properties inside this object." : "Fields for each array item."}
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={onAddChild}>
                    <Plus className="h-4 w-4" /> Add nested field
                  </Button>
                </div>

                <div className="space-y-3 border-l border-border/80 pl-4">
                  {field.children.map((child) => (
                    <FieldEditor
                      key={child.id}
                      field={child}
                      scopeFields={field.children}
                      issuesByField={issuesByField}
                      depth={depth + 1}
                      onChange={(patch) => {
                        const next = field.children.map((item) => (item.id === child.id ? { ...item, ...patch } : item));
                        onChange({ children: next });
                      }}
                      onRemove={() => {
                        onChange({ children: field.children.filter((item) => item.id !== child.id) });
                      }}
                      onMove={(direction) => {
                        const childIndex = field.children.findIndex((item) => item.id === child.id);
                        const targetIndex = childIndex + direction;
                        if (targetIndex < 0 || targetIndex >= field.children.length) {
                          return;
                        }

                        const next = [...field.children];
                        [next[childIndex], next[targetIndex]] = [next[targetIndex], next[childIndex]];
                        onChange({ children: next });
                      }}
                      onAddChild={() => {
                        const next = field.children.map((item) =>
                          item.id === child.id ? { ...item, children: [...item.children, createField("string")] } : item,
                        );
                        onChange({ children: next });
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
