import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FORM_BUILDER_STORAGE_KEY } from "../../lib/storage";
import { buildSchema, createInitialFormDefinition } from "../../model";
import { JsonSchemaFormBuilderApp } from "../json-schema-form-builder-app";

async function pasteJson(user: ReturnType<typeof userEvent.setup>, value: string) {
  const input = screen.getByLabelText("Paste JSON");
  await user.clear(input);
  await user.click(input);
  await user.paste(value);
}

describe("JsonSchemaFormBuilderApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("hydrates from local storage and saves updates with a debounce", async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      FORM_BUILDER_STORAGE_KEY,
      JSON.stringify({ title: "Stored Survey", description: "Saved copy", fields: [] }),
    );

    render(<JsonSchemaFormBuilderApp />);

    const titleInput = screen.getByLabelText("Form title");
    expect(titleInput).toHaveValue("Stored Survey");

    await user.clear(titleInput);
    await user.type(titleInput, "Updated Survey");

    await waitFor(() => {
      const saved = window.localStorage.getItem(FORM_BUILDER_STORAGE_KEY);
      expect(saved).toContain("Updated Survey");
    });
  });

  it("blocks export when duplicate keys exist", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    await user.click(screen.getByRole("button", { name: "Add field" }));

    const cards = screen.getAllByTestId(/root-field-editor-/);
    const lastCard = cards[cards.length - 1];
    const keyInput = within(lastCard).getByLabelText("Key");

    await user.clear(keyInput);
    await user.type(keyInput, "request_type");

    expect(screen.getByTestId("validation-summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy JSON|Copied|Copy failed/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export Schema" })).toBeDisabled();
  });

  it("updates enum options and compiles conditional rules into native schema branches", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    const requestTypeCard = screen.getAllByTestId(/root-field-editor-/)[1];
    await user.clear(within(requestTypeCard).getByLabelText("Option 1"));
    await user.type(within(requestTypeCard).getByLabelText("Option 1"), "Incident");

    const bugDetailsCard = screen.getAllByTestId(/root-field-editor-/)[2];
    await user.clear(within(bugDetailsCard).getByLabelText("Condition 1 equals"));
    await user.type(within(bugDetailsCard).getByLabelText("Condition 1 equals"), "Incident");

    await user.click(screen.getByRole("tab", { name: "JSON Schema" }));

    expect(screen.getByTestId("schema-output")).toHaveTextContent('"Incident"');
    expect(screen.getByTestId("schema-output")).toHaveTextContent('"allOf"');
    expect(screen.getByTestId("schema-output")).toHaveTextContent('"request_type"');
    expect(screen.getByTestId("schema-output")).not.toHaveTextContent('"x-conditions"');
    expect(screen.getByTestId("schema-output")).not.toHaveTextContent('"x-ui"');
  });

  it("reorders fields inside the builder", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    await user.click(screen.getByRole("button", { name: "Move Contact Details down" }));

    const cards = screen.getAllByTestId(/root-field-editor-/);
    expect(within(cards[0]).getByDisplayValue("Request Type")).toBeInTheDocument();
    expect(within(cards[1]).getByDisplayValue("Contact Details")).toBeInTheDocument();
  });

  it("collapses and expands field editor cards", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    const firstCard = screen.getAllByTestId(/root-field-editor-/)[0];
    const summaryToggle = within(firstCard).getByRole("button", { name: "Collapse Contact Details" });

    expect(within(summaryToggle).getByText("Key: contact_details")).toBeInTheDocument();

    await user.click(summaryToggle);
    expect(within(firstCard).queryByLabelText("Label")).not.toBeInTheDocument();
    expect(within(firstCard).getByRole("button", { name: "Expand Contact Details" })).toBeInTheDocument();

    await user.click(within(firstCard).getByRole("button", { name: "Expand Contact Details" }));
    expect(within(firstCard).getByDisplayValue("Contact Details")).toBeInTheDocument();
  });

  it("uses the preview as an interactive form and hides inactive conditional fields", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    const previewPanel = screen.getByTestId("preview-panel");
    expect(within(previewPanel).queryByText("Bug Details")).not.toBeInTheDocument();

    await user.click(within(previewPanel).getByLabelText("Bug"));
    expect(within(previewPanel).getByText("Bug Details")).toBeInTheDocument();

    const fullNameInput = within(previewPanel).getByLabelText("Full Name");
    await user.type(fullNameInput, "Taylor");
    expect(fullNameInput).toHaveValue("Taylor");
  });

  it("renders list-of-text preview fields with label and description", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    const previewPanel = screen.getByTestId("preview-panel");

    expect(within(previewPanel).getByText("Related Links")).toBeInTheDocument();
    expect(within(previewPanel).getByText("A simple list of text items")).toBeInTheDocument();
    expect(within(previewPanel).getByLabelText("Related Links item 1")).toBeInTheDocument();

    await user.click(within(previewPanel).getByRole("button", { name: "Add Related Links item" }));
    expect(within(previewPanel).getByLabelText("Related Links item 2")).toBeInTheDocument();
  });

  it("disables always required for conditional fields", () => {
    render(<JsonSchemaFormBuilderApp />);

    const bugDetailsCard = screen.getAllByTestId(/root-field-editor-/)[2];
    const alwaysRequiredSwitch = within(bugDetailsCard).getAllByRole("switch")[0];

    expect(within(bugDetailsCard).getAllByText("Always Required")[0]).toBeInTheDocument();
    expect(alwaysRequiredSwitch).toBeDisabled();
  });

  it("imports pasted draft json into the builder", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    await pasteJson(
      user,
      JSON.stringify({
        title: "Imported title",
        description: "Imported description",
        fields: [
          {
            id: "field-1",
            key: "request_summary",
            title: "Request Summary",
            description: "",
            type: "textarea",
            required: true,
            options: [],
            children: [],
            conditions: [],
          },
        ],
      }),
    );
    await user.click(screen.getByRole("button", { name: "Import JSON" }));

    expect(screen.getByLabelText("Form title")).toHaveValue("Imported title");
    expect(screen.getByLabelText("Form description")).toHaveValue("Imported description");
    expect(screen.getByDisplayValue("Request Summary")).toBeInTheDocument();
    expect(screen.getByText("Imported JSON into the builder.")).toBeInTheDocument();
  });

  it("imports exported schema into editable builder fields", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    await pasteJson(user, JSON.stringify(buildSchema(createInitialFormDefinition())));
    await user.click(screen.getByRole("button", { name: "Import JSON" }));

    expect(screen.getByDisplayValue("Contact Details")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Request Type")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Team Members")).toBeInTheDocument();
  });

  it("preserves the current draft when pasted json is invalid", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    await user.clear(screen.getByLabelText("Form title"));
    await user.type(screen.getByLabelText("Form title"), "Current draft");

    await pasteJson(user, "{");
    await user.click(screen.getByRole("button", { name: "Import JSON" }));

    expect(screen.getByLabelText("Form title")).toHaveValue("Current draft");
    expect(screen.getByText("Pasted text is not valid JSON.")).toBeInTheDocument();
  });

  it("clears prior preview answers after a successful import", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    const previewPanel = screen.getByTestId("preview-panel");
    const fullNameInput = within(previewPanel).getByLabelText("Full Name");
    await user.type(fullNameInput, "Taylor");
    expect(fullNameInput).toHaveValue("Taylor");

    await pasteJson(
      user,
      JSON.stringify({
        title: "Replacement form",
        description: "",
        fields: [
          {
            id: "field-1",
            key: "full_name",
            title: "Full Name",
            description: "",
            type: "string",
            required: false,
            options: [],
            children: [],
            conditions: [],
          },
        ],
      }),
    );
    await user.click(screen.getByRole("button", { name: "Import JSON" }));

    expect(within(screen.getByTestId("preview-panel")).getByLabelText("Full Name")).toHaveValue("");
  });
});
