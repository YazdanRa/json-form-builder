import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FormField } from "@/features/form-builder/model";

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

export function PreviewField({ field }: { field: FormField }) {
  if (field.type === "section") {
    return (
      <div className="space-y-4 rounded-3xl border border-dashed border-primary/35 bg-white/86 p-5">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-foreground">{field.title || "Untitled section"}</div>
          {field.description ? <div className="text-sm text-muted-foreground">{field.description}</div> : null}
        </div>
        <div className="space-y-4">
          {field.children.map((child) => (
            <PreviewField key={child.id} field={child} />
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "object") {
    return (
      <div className="space-y-3 rounded-[24px] border border-slate-300/72 bg-white/82 p-4">
        <div>
          <div className="text-sm font-semibold text-foreground">{field.title}</div>
          {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
        </div>
        {renderConditionCopy(field)}
        {field.children.map((child) => (
          <PreviewField key={child.id} field={child} />
        ))}
      </div>
    );
  }

  if (field.type === "array_object") {
    return (
      <div className="space-y-3 rounded-[24px] border border-slate-300/72 bg-white/82 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{field.title}</div>
            {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
          </div>
          <Button type="button" variant="outline" size="sm" disabled>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>
        {renderConditionCopy(field)}
        <div className="space-y-3 rounded-[20px] border border-dashed border-border/90 bg-muted/58 p-3">
          {field.children.map((child) => (
            <PreviewField key={child.id} field={child} />
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "array_string") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input placeholder={field.placeholder || field.title} disabled />
          <Button type="button" variant="outline" size="icon" disabled>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
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
            return <Textarea placeholder={field.placeholder || field.title} disabled />;
          case "number":
          case "integer":
            return <Input type="number" placeholder={field.placeholder || field.title} disabled />;
          case "email":
            return <Input type="email" placeholder={field.placeholder || field.title} disabled />;
          case "date":
            return <Input type="date" disabled />;
          case "boolean":
            return (
              <div className="flex items-center gap-3 rounded-[18px] border border-slate-300/75 bg-white/88 p-3">
                <Switch disabled />
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
                    <input type="radio" disabled name={field.id} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            );
          default:
            return <Input placeholder={field.placeholder || field.title} disabled />;
        }
      })()}
    </div>
  );
}
