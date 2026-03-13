import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { resolveFieldKey, type FormField } from "@/features/form-builder/model";

export interface PreviewScope {
  [key: string]: PreviewValue | undefined;
}

export type PreviewValue = string | boolean | PreviewScope | PreviewScope[] | string[];

interface PreviewFieldProps {
  field: FormField;
  fieldIndex: number;
  scopeValues: PreviewScope;
  setScopeValue: (key: string, value: PreviewValue | undefined) => void;
}

function isPreviewScope(value: PreviewValue | undefined): value is PreviewScope {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPreviewScopeList(value: PreviewValue | undefined): value is PreviewScope[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item));
}

function isStringList(value: PreviewValue | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function getConditionComparableValue(value: PreviewValue | undefined) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return typeof value === "string" ? value : "";
}

function isFieldVisible(field: FormField, scopeValues: PreviewScope) {
  const validConditions = field.conditions.filter((condition) => condition.dependsOn && condition.equals !== "");
  if (!validConditions.length) {
    return true;
  }

  return validConditions.every(
    (condition) => getConditionComparableValue(scopeValues[condition.dependsOn]) === condition.equals,
  );
}

function renderConditionCopy(field: FormField) {
  const validConditions = field.conditions.filter((condition) => condition.dependsOn && condition.equals !== "");
  if (!validConditions.length) {
    return null;
  }

  const text = validConditions
    .map((condition) => `${condition.dependsOn} = ${condition.equals}`)
    .join(" and ");

  return (
    <div className="rounded-[18px] bg-[rgba(255,214,10,0.18)] px-3 py-2 text-xs font-medium text-[rgb(124,77,0)]">
      Visible when {text}
    </div>
  );
}

export function PreviewField({ field, fieldIndex, scopeValues, setScopeValue }: PreviewFieldProps) {
  if (!isFieldVisible(field, scopeValues)) {
    return null;
  }

  const fieldKey = resolveFieldKey(field, fieldIndex);
  const currentValue = scopeValues[fieldKey];

  if (field.type === "section") {
    return (
      <div className="space-y-4 rounded-3xl border border-dashed border-primary/35 bg-white/86 p-5">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-foreground">{field.title || "Untitled section"}</div>
          {field.description ? <div className="text-sm text-muted-foreground">{field.description}</div> : null}
        </div>
        <div className="space-y-4">
          {field.children.map((child, childIndex) => (
            <PreviewField
              key={child.id}
              field={child}
              fieldIndex={childIndex}
              scopeValues={scopeValues}
              setScopeValue={setScopeValue}
            />
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "object") {
    const objectValue = isPreviewScope(currentValue) ? currentValue : {};

    return (
      <div className="space-y-3 rounded-[24px] border border-slate-300/72 bg-white/82 p-4">
        <div>
          <div className="text-sm font-semibold text-foreground">{field.title}</div>
          {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
        </div>
        {renderConditionCopy(field)}
        {field.children.map((child, childIndex) => (
          <PreviewField
            key={child.id}
            field={child}
            fieldIndex={childIndex}
            scopeValues={objectValue}
            setScopeValue={(childKey, value) =>
              setScopeValue(fieldKey, {
                ...objectValue,
                [childKey]: value,
              })
            }
          />
        ))}
      </div>
    );
  }

  if (field.type === "array_object") {
    const items = isPreviewScopeList(currentValue) ? currentValue : [];

    return (
      <div className="space-y-3 rounded-[24px] border border-slate-300/72 bg-white/82 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{field.title}</div>
            {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setScopeValue(fieldKey, [...items, {}])}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>
        {renderConditionCopy(field)}
        {items.length ? (
          <div className="space-y-3 rounded-[20px] border border-dashed border-border/90 bg-muted/58 p-3">
            {items.map((item, itemIndex) => (
              <div key={`${field.id}-item-${itemIndex}`} className="space-y-3 rounded-[18px] bg-white/84 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Item {itemIndex + 1}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setScopeValue(
                        fieldKey,
                        items.filter((_, index) => index !== itemIndex),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
                {field.children.map((child, childIndex) => (
                  <PreviewField
                    key={`${itemIndex}-${child.id}`}
                    field={child}
                    fieldIndex={childIndex}
                    scopeValues={item}
                    setScopeValue={(childKey, value) =>
                      setScopeValue(
                        fieldKey,
                        items.map((entry, index) =>
                          index === itemIndex
                            ? {
                                ...item,
                                [childKey]: value,
                              }
                            : entry,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-border/90 bg-muted/58 px-4 py-5 text-sm text-muted-foreground">
            Add an item to preview repeated fields.
          </div>
        )}
      </div>
    );
  }

  if (field.type === "array_string") {
    const items = isStringList(currentValue) ? currentValue : [""];

    return (
      <div className="space-y-2">
        {items.map((item, itemIndex) => (
          <div key={`${field.id}-item-${itemIndex}`} className="flex items-center gap-2">
            <Input
              aria-label={`${field.title || "Untitled question"} item ${itemIndex + 1}`}
              placeholder={field.placeholder || field.title}
              value={item}
              onChange={(event) => {
                const next = [...items];
                next[itemIndex] = event.target.value;
                setScopeValue(fieldKey, next);
              }}
            />
            {items.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remove ${field.title || "Untitled question"} item ${itemIndex + 1}`}
                onClick={() => setScopeValue(fieldKey, items.filter((_, index) => index !== itemIndex))}
              >
                <Minus className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Add ${field.title || "Untitled question"} item`}
              onClick={() => setScopeValue(fieldKey, [...items, ""])}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {renderConditionCopy(field)}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-[24px] border border-slate-300/72 bg-white/82 p-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-foreground">{field.title || "Untitled question"}</Label>
        {field.required ? <span className="text-xs font-semibold text-destructive">*</span> : null}
      </div>
      {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
      {renderConditionCopy(field)}
      {(() => {
        switch (field.type) {
          case "textarea":
            return (
              <Textarea
                placeholder={field.placeholder || field.title}
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
          case "number":
          case "integer":
            return (
              <Input
                type="number"
                placeholder={field.placeholder || field.title}
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
          case "email":
            return (
              <Input
                type="email"
                placeholder={field.placeholder || field.title}
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
          case "date":
            return (
              <Input
                type="date"
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
          case "boolean":
            return (
              <div className="flex items-center gap-3 rounded-[18px] border border-slate-300/75 bg-white/88 p-3">
                <Switch
                  checked={currentValue === true}
                  onCheckedChange={(checked) => setScopeValue(fieldKey, checked)}
                />
                <span className="text-sm text-muted-foreground">Toggle answer</span>
              </div>
            );
          case "enum":
            return (
              <div className="space-y-2">
                {field.options.map((option, index) => (
                  <label
                    key={`${field.id}-${index}`}
                    className="flex items-center gap-2 rounded-[18px] border border-slate-300/75 bg-white/88 px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={field.id}
                      checked={currentValue === option}
                      onChange={() => setScopeValue(fieldKey, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            );
          default:
            return (
              <Input
                placeholder={field.placeholder || field.title}
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
        }
      })()}
    </div>
  );
}
