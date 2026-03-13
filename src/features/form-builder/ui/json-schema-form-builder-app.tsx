import { useEffect, useMemo, useReducer, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, Copy, Download, FileJson, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { clearStoredFormDefinition, loadStoredFormDefinition, saveStoredFormDefinition } from "../lib/storage";
import { copySchemaToClipboard, downloadSchemaFile, formatSchemaFilename } from "../lib/export";
import {
  buildSchema,
  createInitialFormDefinition,
  formBuilderReducer,
  validateFormDefinition,
  type FormDefinition,
} from "../model";
import { FieldEditor } from "./field-editor";
import { PreviewField } from "./preview-field";

export function JsonSchemaFormBuilderApp() {
  const seedForm = useMemo(() => createInitialFormDefinition(), []);
  const [form, dispatch] = useReducer(formBuilderReducer, seedForm, loadStoredFormDefinition);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      saveStoredFormDefinition(form);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [form]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyState("idle"), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const validation = useMemo(() => validateFormDefinition(form), [form]);
  const canExport = !validation.hasBlockingIssues;
  const schema = useMemo(() => (canExport ? buildSchema(form) : null), [canExport, form]);
  const schemaJson = useMemo(() => (schema ? JSON.stringify(schema, null, 2) : ""), [schema]);

  async function handleCopyJson() {
    if (!schemaJson) {
      return;
    }

    try {
      const copied = await copySchemaToClipboard(schemaJson);
      setCopyState(copied ? "copied" : "error");
    } catch {
      setCopyState("error");
    }
  }

  function handleDownloadJson() {
    if (!schemaJson) {
      return;
    }

    downloadSchemaFile(formatSchemaFilename(form.title), schemaJson);
  }

  function handleResetDraft() {
    clearStoredFormDefinition();
    dispatch({ type: "reset", form: createInitialFormDefinition() });
    setCopyState("idle");
  }

  function updateMeta(patch: Partial<Pick<FormDefinition, "title" | "description">>) {
    dispatch({ type: "update_meta", patch });
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-slate-300/70 bg-white/74 px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.09)] backdrop-blur-2xl"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-slate-300/75 bg-white/88 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                Form Builder
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-[3.3rem]">
                  Compose forms with a quieter, native feel.
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                  Build a form visually, preview how it reads, and export Draft 2020-12 JSON Schema with section
                  metadata and simple equality-based conditions. The interface now follows a more Apple-like visual
                  system with restrained materials, softer hierarchy, and content-first spacing.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-300/75 bg-white/86 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-primary">Scope</div>
                <div className="mt-2 font-semibold text-foreground">Client-only MVP</div>
              </div>
              <div className="rounded-[24px] border border-slate-300/75 bg-white/86 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-primary">Persistence</div>
                <div className="mt-2 font-semibold text-foreground">Autosaved locally</div>
              </div>
              <div className="rounded-[24px] border border-slate-300/75 bg-white/86 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-primary">Export</div>
                <div className="mt-2 font-semibold text-foreground">Draft 2020-12</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden bg-white/84">
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-[2rem]">Form Builder</CardTitle>
                    <CardDescription>
                      Edit the form definition, manage nested fields, and keep the export safe with inline validation.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={handleResetDraft}>
                      <RotateCcw className="h-4 w-4" /> Reset draft
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCopyJson} disabled={!canExport}>
                      <Copy className="h-4 w-4" />
                      {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy JSON"}
                    </Button>
                    <Button type="button" onClick={handleDownloadJson} disabled={!canExport}>
                      <Download className="h-4 w-4" /> Export Schema
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="form-title">Form title</Label>
                    <Input
                      id="form-title"
                      value={form.title}
                      onChange={(event) => updateMeta({ title: event.target.value })}
                      placeholder="Untitled form"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="form-description">Form description</Label>
                    <Textarea
                      id="form-description"
                      value={form.description}
                      onChange={(event) => updateMeta({ description: event.target.value })}
                      placeholder="Add a short description"
                      className="min-h-[96px]"
                    />
                  </div>
                </div>

                {validation.issues.length ? (
                  <div
                    className="rounded-[24px] border border-destructive/20 bg-[rgba(255,59,48,0.08)] p-4"
                    data-testid="validation-summary"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-destructive">
                          Resolve duplicate keys before exporting.
                        </div>
                        <div className="space-y-1 text-sm text-destructive/90">
                          {validation.issues.map((issue) => (
                            <p key={`${issue.fieldId}-${issue.key}`}>{issue.message}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <Separator />

                <div className="space-y-4">
                  {form.fields.map((field) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      scopeFields={form.fields}
                      issuesByField={validation.issuesByField}
                      onChange={(patch) => dispatch({ type: "update_field", fieldId: field.id, patch })}
                      onRemove={() => dispatch({ type: "remove_field", fieldId: field.id })}
                      onMove={(direction) => dispatch({ type: "move_field", fieldId: field.id, direction })}
                      onAddChild={() => dispatch({ type: "add_child_field", parentId: field.id })}
                    />
                  ))}
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <Button type="button" variant="outline" className="border-dashed" onClick={() => dispatch({ type: "add_field" })}>
                    <Plus className="h-4 w-4" /> Add field
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-dashed"
                    onClick={() => dispatch({ type: "add_field", fieldType: "section" })}
                  >
                    <Plus className="h-4 w-4" /> Add section
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Tabs defaultValue="preview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="schema">JSON Schema</TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                <Card className="bg-white/84">
                  <CardHeader>
                    <CardTitle>{form.title || "Untitled form"}</CardTitle>
                    <CardDescription>{form.description || "No description provided."}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {form.fields.map((field, index) => (
                      <div key={field.id} className="space-y-3">
                        {index > 0 ? (
                          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground">
                            <ChevronRight className="h-3 w-3" /> Next block
                          </div>
                        ) : null}
                        <PreviewField field={field} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schema">
                <Card className="bg-white/84">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileJson className="h-5 w-5 text-primary" />
                      <CardTitle>Generated JSON Schema</CardTitle>
                    </div>
                    <CardDescription>
                      Draft 2020-12 plus UI metadata for sections, placeholders, and simple conditional hints.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {schema ? (
                      <pre
                        data-testid="schema-output"
                        className={cn(
                          "max-h-[70vh] overflow-auto rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#1f2937,#111827)] p-4 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                          "font-mono",
                        )}
                      >
                        {schemaJson}
                      </pre>
                    ) : (
                      <div className="rounded-[24px] border border-destructive/20 bg-[rgba(255,59,48,0.08)] p-4 text-sm text-destructive">
                        Export is disabled until duplicate keys are resolved in the builder.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
