import { createInitialFormDefinition } from "../model";
import type { FormDefinition } from "../model";

export const FORM_BUILDER_STORAGE_KEY = "json-form-builder:draft:v1";

function isFormDefinition(value: unknown): value is FormDefinition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as FormDefinition;
  return typeof candidate.title === "string" && typeof candidate.description === "string" && Array.isArray(candidate.fields);
}

export function loadStoredFormDefinition(fallback = createInitialFormDefinition()): FormDefinition {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(FORM_BUILDER_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isFormDefinition(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredFormDefinition(form: FormDefinition) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FORM_BUILDER_STORAGE_KEY, JSON.stringify(form));
}

export function clearStoredFormDefinition() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(FORM_BUILDER_STORAGE_KEY);
}
