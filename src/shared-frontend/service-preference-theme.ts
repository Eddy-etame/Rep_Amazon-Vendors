export type ThemePreference = 'system' | 'light' | 'dark';

export const AMAZ_THEME_PREFERENCE_KEY = 'amaz_theme_preference';

function normalizeThemePreference(raw: unknown): ThemePreference {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

function hasDocument(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement;
}

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function readStoredThemePreference(): ThemePreference {
  if (!hasStorage()) {
    return 'system';
  }
  try {
    return normalizeThemePreference(localStorage.getItem(AMAZ_THEME_PREFERENCE_KEY));
  } catch {
    return 'system';
  }
}

export function applyThemePreferenceToDocument(preference: ThemePreference): ThemePreference {
  const normalized = normalizeThemePreference(preference);
  if (!hasDocument()) {
    return normalized;
  }

  const root = document.documentElement;
  if (normalized === 'system') {
    delete root.dataset['theme'];
  } else {
    root.dataset['theme'] = normalized;
  }
  return normalized;
}

export function persistThemePreference(preference: ThemePreference): ThemePreference {
  const normalized = normalizeThemePreference(preference);
  if (!hasStorage()) {
    return normalized;
  }
  try {
    localStorage.setItem(AMAZ_THEME_PREFERENCE_KEY, normalized);
  } catch {
    return normalized;
  }
  return normalized;
}

export class ServicePreferenceTheme {
  private currentPreference = readStoredThemePreference();

  constructor() {
    applyThemePreferenceToDocument(this.currentPreference);
  }

  get current(): ThemePreference {
    this.currentPreference = readStoredThemePreference();
    return this.currentPreference;
  }

  setPreference(preference: ThemePreference): void {
    const normalized = persistThemePreference(preference);
    applyThemePreferenceToDocument(normalized);
    this.currentPreference = normalized;
  }
}
