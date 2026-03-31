# JSON Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paste-to-import flow that accepts builder draft JSON and supported exported JSON Schema, then hydrates the form builder into an editable draft.

**Architecture:** Keep parsing and conversion in the form-builder model layer so the React component only manages input text and result messaging. Reuse the reducer hydrate path and existing autosave instead of introducing a parallel import state pipeline.

**Tech Stack:** React 19, TypeScript, Vitest, React Testing Library, Bun, Vite

---

### Task 1: Add model import parsing and conversion

**Files:**
- Create: `src/features/form-builder/model/import.ts`
- Modify: `src/features/form-builder/model/index.ts`
- Test: `src/features/form-builder/model/__tests__/import.test.ts`

- [ ] **Step 1: Write the failing model tests**

```ts
it("accepts builder draft JSON", () => {
  const result = importFormDefinitionJson(JSON.stringify({ title: "Imported", description: "", fields: [] }));
  expect(result.ok).toBe(true);
});

it("converts supported exported schema into a form definition", () => {
  const schema = buildSchema(createInitialFormDefinition());
  const result = importFormDefinitionJson(JSON.stringify(schema));
  expect(result.ok).toBe(true);
});

it("rejects unsupported schema constructs", () => {
  const result = importFormDefinitionJson(JSON.stringify({ type: "object", properties: { a: { oneOf: [] } } }));
  expect(result.ok).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test:run src/features/form-builder/model/__tests__/import.test.ts`
Expected: FAIL because the import module does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
export function importFormDefinitionJson(input: string): ImportResult {
  const parsed = JSON.parse(input) as unknown;
  if (looksLikeDraft(parsed)) {
    return { ok: true, form: normalizeFormDefinition(parsed) };
  }

  if (looksLikeSupportedSchema(parsed)) {
    return { ok: true, form: convertSchemaToFormDefinition(parsed) };
  }

  return { ok: false, error: "Pasted JSON must be a builder draft or supported JSON Schema." };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test:run src/features/form-builder/model/__tests__/import.test.ts`
Expected: PASS

- [ ] **Step 5: Refine mapping coverage**

Add tests and implementation for nested objects, array items, `required`, and supported `allOf` conditional imports until the model import suite covers the accepted subset.

### Task 2: Add the import panel to the builder UI

**Files:**
- Modify: `src/features/form-builder/ui/json-schema-form-builder-app.tsx`
- Test: `src/features/form-builder/ui/__tests__/json-schema-form-builder-app.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

```tsx
it("imports pasted draft json into the builder", async () => {
  render(<JsonSchemaFormBuilderApp />);
  await user.type(screen.getByLabelText("Paste JSON"), JSON.stringify({ title: "Imported title", description: "", fields: [] }));
  await user.click(screen.getByRole("button", { name: "Import JSON" }));
  expect(screen.getByLabelText("Form title")).toHaveValue("Imported title");
});

it("preserves the current draft when pasted json is invalid", async () => {
  render(<JsonSchemaFormBuilderApp />);
  await user.type(screen.getByLabelText("Paste JSON"), "{");
  await user.click(screen.getByRole("button", { name: "Import JSON" }));
  expect(screen.getByLabelText("Form title")).toHaveValue("Project Intake Form");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test:run src/features/form-builder/ui/__tests__/json-schema-form-builder-app.test.tsx`
Expected: FAIL because the import UI and behavior do not exist.

- [ ] **Step 3: Implement the minimal UI behavior**

```tsx
const [importText, setImportText] = useState("");
const [importState, setImportState] = useState<{ status: "idle" | "success" | "error"; message: string }>({
  status: "idle",
  message: "",
});

function handleImportJson() {
  const result = importFormDefinitionJson(importText);
  if (!result.ok) {
    setImportState({ status: "error", message: result.error });
    return;
  }

  dispatch({ type: "hydrate", form: result.form });
  setPreviewValues({});
  setImportState({ status: "success", message: "Imported JSON into the builder." });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test:run src/features/form-builder/ui/__tests__/json-schema-form-builder-app.test.tsx`
Expected: PASS

### Task 3: Verify the full feature contract

**Files:**
- Modify: `src/features/form-builder/model/__tests__/import.test.ts`
- Modify: `src/features/form-builder/ui/__tests__/json-schema-form-builder-app.test.tsx`

- [ ] **Step 1: Add regression coverage for supported schema and preview reset**

```ts
it("imports exported schema and keeps it editable", async () => {
  // import schema, assert title and field labels appear in the builder
});

it("clears prior preview answers after a successful import", async () => {
  // set preview input, import a new draft, assert old preview value is gone
});
```

- [ ] **Step 2: Run the targeted suites**

Run: `bun run test:run src/features/form-builder/model/__tests__/import.test.ts src/features/form-builder/ui/__tests__/json-schema-form-builder-app.test.tsx`
Expected: PASS

- [ ] **Step 3: Run repo verification**

Run: `bun run check`
Expected: PASS
