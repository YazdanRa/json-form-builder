import { createInitialFormDefinition, normalizeFormDefinition } from "../model";
import type { FormDefinition } from "../model";

export const FORM_BUILDER_STORAGE_KEY = "json-form-builder:draft:v1";

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
    return normalizeFormDefinition(parsed);
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
