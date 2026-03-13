import { toSafeKey } from "../model";

export async function copySchemaToClipboard(value: string) {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(value);
  return true;
}

export function formatSchemaFilename(title: string) {
  return `${toSafeKey(title || "form_schema")}.schema.json`;
}

export function downloadSchemaFile(filename: string, value: string) {
  const blob = new Blob([value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}
