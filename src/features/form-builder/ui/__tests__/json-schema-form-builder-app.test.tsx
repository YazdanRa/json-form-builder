import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FORM_BUILDER_STORAGE_KEY } from "../../lib/storage";
import { JsonSchemaFormBuilderApp } from "../json-schema-form-builder-app";

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

  it("updates enum options and conditional rules in the schema output", async () => {
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
    expect(screen.getByTestId("schema-output")).toHaveTextContent('"dependsOn": "request_type"');
    expect(screen.getByTestId("schema-output")).toHaveTextContent('"equals": "Incident"');
  });

  it("reorders fields inside the builder", async () => {
    const user = userEvent.setup();
    render(<JsonSchemaFormBuilderApp />);

    await user.click(screen.getByRole("button", { name: "Move Contact Details down" }));

    const cards = screen.getAllByTestId(/root-field-editor-/);
    expect(within(cards[0]).getByDisplayValue("Request Type")).toBeInTheDocument();
    expect(within(cards[1]).getByDisplayValue("Contact Details")).toBeInTheDocument();
  });
});
