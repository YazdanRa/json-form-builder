# JSON Import Design

## Summary

Add a paste-to-import workflow that lets users replace the current editable draft by pasting either:

- The app's internal draft JSON shape (`FormDefinition`)
- A supported JSON Schema document previously exported by this app

The imported result must become fully editable in the existing builder UI, persist through the current local-storage draft flow, and fail safely when the JSON cannot be parsed or cannot be represented by the builder model.

## Goals

- Let users paste JSON into the app and continue editing it in the form builder.
- Accept both internal draft JSON and exported JSON Schema.
- Reuse the existing builder state, validation, preview, and autosave flows after import.
- Preserve the current draft when the pasted JSON is invalid or unsupported.

## Non-Goals

- Support arbitrary JSON Schema documents outside the subset this app can already export.
- Support partial imports that silently skip unsupported branches.
- Add file upload, drag-and-drop, or remote URL import.
- Expand the builder model beyond its current field types and condition model.

## Supported Inputs

### 1. Internal Draft JSON

The importer will accept the existing `FormDefinition` shape:

```json
{
  "title": "Project Intake Form",
  "description": "Collect a few basic details.",
  "fields": []
}
```

This path reuses `normalizeFormDefinition`.

### 2. JSON Schema

The importer will accept a constrained root JSON Schema document with:

- Root `type: "object"`
- Root `properties`
- Optional root `title`
- Optional root `description`
- Optional root `required`
- Optional root `allOf` entries that match the app's exported conditional-required pattern

Supported field mappings:

- `type: "string"` -> `string`
- `type: "string"` with `format: "email"` -> `email`
- `type: "string"` with `format: "date"` -> `date`
- `type: "string"` with `enum` -> `enum`
- `type: "number"` -> `number`
- `type: "integer"` -> `integer`
- `type: "boolean"` -> `boolean`
- `type: "object"` -> `object`
- `type: "array"` with `items.type: "string"` -> `array_string`
- `type: "array"` with `items.type: "object"` -> `array_object`

Nested objects and array-object items follow the same supported subset recursively.

Schema import normalization rules:

- Each imported field gets a fresh generated `id`.
- The builder `key` comes from the schema property name.
- The builder `title` prefers the schema node `title`; if absent, it falls back to a humanized version of the property key.
- The builder `description` uses the schema node `description` when present, otherwise an empty string.
- Enum `options` preserve source order.

## Unsupported Schema Cases

The importer will reject the pasted schema with a specific inline error when it encounters any unsupported construct, including:

- Root schemas without `type: "object"`
- Missing or non-object `properties`
- Arrays whose `items` are missing or are not `string` or `object`
- Object constructs outside the builder subset such as `oneOf`, `anyOf`, `not`, `patternProperties`, or tuple arrays
- String formats other than `email` and `date`
- Conditional structures that do not match the app's exported `allOf -> if.properties.<key>.const + then.required` pattern
- Condition branches that require multiple fields at once

Rejecting unsupported constructs is intentional so the editor never imports a draft it cannot round-trip safely.

## Auto-Detection Rules

Import detection will run in this order:

1. Parse the textarea contents as JSON.
2. If the parsed value matches the app draft shape (`title`, `description`, and `fields`), normalize it as a `FormDefinition`.
3. Otherwise, if the parsed value looks like a supported root JSON Schema object, convert it into a `FormDefinition`.
4. Otherwise, show an import error and keep the current draft untouched.

The detection order prefers the internal draft shape because it is the app's native editable model and already has a stable normalizer.

## UI Changes

Add an import panel near the existing export controls in `JsonSchemaFormBuilderApp` with:

- A textarea for pasted JSON
- An `Import JSON` button
- Inline success or error feedback
- A short description explaining that both draft JSON and supported JSON Schema are accepted

Behavior:

- The user can paste JSON at any time.
- A successful import replaces the current form definition in the builder.
- The import textarea contents remain editable until the user changes or clears them.
- Invalid JSON or unsupported schema shows inline feedback and does not replace the current draft.
- The existing reset action continues to restore the seeded example form.

## State Flow

On import success:

1. Parse the textarea contents.
2. Convert the payload into a valid `FormDefinition`.
3. Dispatch a full-state replacement into the reducer.
4. Clear transient preview answers.
5. Clear any prior import error state.
6. Let the existing autosave effect persist the imported form to local storage.

On import failure:

1. Preserve the current form definition.
2. Preserve the current preview state.
3. Surface a specific inline error in the import panel.

No partial import path will exist.

## Architecture Changes

### Model

Add a dedicated import module in `src/features/form-builder/model` responsible for:

- Detecting draft JSON versus JSON Schema input
- Converting supported JSON Schema nodes into `FormField` values
- Translating supported conditional `allOf` blocks back into builder `conditions`
- Returning either a valid `FormDefinition` or a descriptive error

This logic stays outside the React component so it can be unit tested directly.

### Reducer

The existing full-form replacement action can be reused for successful imports. No reducer shape change is required unless a clearer action name is preferred for readability.

### Storage

No storage API change is required. Successful imports flow through the existing debounced autosave.

## Conditional Import Rules

The importer will support only the conditional shape already exported by the app:

```json
{
  "allOf": [
    {
      "if": {
        "properties": {
          "request_type": { "const": "Bug" }
        },
        "required": ["request_type"]
      },
      "then": {
        "required": ["bug_details"]
      }
    }
  ]
}
```

Import mapping rules:

- `if.properties.<dependency>.const` becomes `dependsOn` + `equals`
- `then.required` must contain exactly one target field key
- The target field becomes conditional in the builder model
- Conditional required fields remain represented through conditions, not unconditional `required`

Unsupported conditional shapes fail import instead of being ignored.

## Testing

### Model Tests

Add tests for:

- Importing a valid internal draft JSON payload
- Importing a valid exported JSON Schema payload
- Mapping nested objects and array-object items
- Mapping `required` arrays
- Mapping supported conditional `allOf` branches
- Rejecting invalid JSON shape
- Rejecting unsupported schema constructs with a descriptive error

### UI Tests

Add tests for:

- Pasting and importing internal draft JSON updates the builder fields
- Pasting and importing exported schema updates the builder fields
- Invalid JSON shows an error and preserves the existing draft
- Unsupported schema shows an error and preserves the existing draft
- Successful import clears preview answers from the prior draft state

## Implementation Notes

- Keep the import subset aligned with the current export subset so round-tripping remains predictable.
- Prefer explicit error messages over generic failures because users need to understand whether the problem is malformed JSON or an unsupported schema feature.
- Keep the component thin by delegating parsing and conversion logic to the model layer.

## Explicit Interaction Decision

Use one import action button rather than live-importing on paste. This keeps replacement explicit, avoids clobbering the current draft on partial edits, and is consistent with the current explicit export controls.
