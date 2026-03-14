import { expect, test } from "@playwright/test";

test("builds and exports a schema draft", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Form Builder" })).toBeVisible();

  await page.getByLabel("Form title").fill("Launch Survey");
  await page.getByRole("button", { name: "Add field" }).click();

  const lastCard = page.locator('[data-testid^="root-field-editor-"]').last();
  await lastCard.getByLabel("Label").fill("Priority");
  await lastCard.getByLabel("Key").fill("priority");

  await page.getByRole("tab", { name: "JSON Schema" }).click();
  await expect(page.getByTestId("schema-output")).toContainText('"title": "Launch Survey"');
  await expect(page.getByTestId("schema-output")).toContainText('"priority"');
  await expect(page.getByTestId("schema-output")).toContainText('"allOf"');
  await expect(page.getByTestId("schema-output")).not.toContainText('"x-conditions"');
  await expect(page.getByTestId("schema-output")).not.toContainText('"x-ui"');
  await expect(page.getByTestId("schema-output")).not.toContainText('"x-placeholder"');

  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.getByTestId("preview-panel").getByText("Bug Details")).toHaveCount(0);
  await page.getByTestId("preview-panel").getByLabel("Bug").check();
  await expect(page.getByTestId("preview-panel").getByText("Bug Details")).toBeVisible();

  await page.getByRole("button", { name: "Copy JSON" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Schema" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("launch_survey.schema.json");
});
