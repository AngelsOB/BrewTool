export type StoredValue<T> = {
  version: number;
  value: T;
};

export function loadJson<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw) as StoredValue<T> | T;
    if (parsed && typeof parsed === "object" && "value" in (parsed as object)) {
      return (parsed as StoredValue<T>).value;
    }
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

export function saveJson<T>(key: string, value: T, version = 1): void {
  const payload: StoredValue<T> = { version, value };
  localStorage.setItem(key, JSON.stringify(payload));
}
