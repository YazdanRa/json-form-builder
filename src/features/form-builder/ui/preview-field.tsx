import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { areConditionsSatisfied, resolveFieldKey, type FormField } from "@/features/form-builder/model";

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

function getVisibleChildren(fields: FormField[], scopeValues: PreviewScope) {
  return fields.flatMap((field, index) =>
    areConditionsSatisfied(field.conditions, scopeValues) ? [{ field, index }] : [],
  );
}

export function PreviewField({ field, fieldIndex, scopeValues, setScopeValue }: PreviewFieldProps) {
  if (!areConditionsSatisfied(field.conditions, scopeValues)) {
    return null;
  }

  const fieldKey = resolveFieldKey(field, fieldIndex);
  const currentValue = scopeValues[fieldKey];
  const isRequiredWhenVisible = field.required || field.conditions.length > 0;

  if (field.type === "object") {
    const objectValue = isPreviewScope(currentValue) ? currentValue : {};

    return (
      <div className="space-y-3 rounded-[24px] border border-slate-300/72 bg-white/82 p-4">
        <div>
          <div className="text-sm font-semibold text-foreground">{field.title}</div>
          {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
        </div>
        {getVisibleChildren(field.children, objectValue).map(({ field: child, index: childIndex }) => (
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
                {getVisibleChildren(field.children, item).map(({ field: child, index: childIndex }) => (
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
      <div className="space-y-2 rounded-[24px] border border-slate-300/72 bg-white/82 p-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-foreground">{field.title || "Untitled question"}</Label>
          {isRequiredWhenVisible ? <span className="text-xs font-semibold text-destructive">*</span> : null}
        </div>
        {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
        {items.map((item, itemIndex) => (
          <div key={`${field.id}-item-${itemIndex}`} className="flex items-center gap-2">
            <Input
              aria-label={`${field.title || "Untitled question"} item ${itemIndex + 1}`}
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
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-[24px] border border-slate-300/72 bg-white/82 p-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-foreground">{field.title || "Untitled question"}</Label>
        {isRequiredWhenVisible ? <span className="text-xs font-semibold text-destructive">*</span> : null}
      </div>
      {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
      {(() => {
        switch (field.type) {
          case "textarea":
            return (
              <Textarea
                aria-label={field.title || "Untitled question"}
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
          case "number":
          case "integer":
            return (
              <Input
                type="number"
                aria-label={field.title || "Untitled question"}
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
          case "email":
            return (
              <Input
                type="email"
                aria-label={field.title || "Untitled question"}
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
          case "date":
            return (
              <Input
                type="date"
                aria-label={field.title || "Untitled question"}
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
                aria-label={field.title || "Untitled question"}
                value={typeof currentValue === "string" ? currentValue : ""}
                onChange={(event) => setScopeValue(fieldKey, event.target.value)}
              />
            );
        }
      })()}
    </div>
  );
}
