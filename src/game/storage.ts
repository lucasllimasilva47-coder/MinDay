export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export const STORAGE_SCHEMA_KEY = "minday.schemaVersion";
export const STORAGE_SCHEMA_VERSION = 1;

export function safeGet(storage: StorageLike, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(storage: StorageLike, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(storage: StorageLike, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function migrateLegacyData(storage: StorageLike): boolean {
  const versionRaw = safeGet(storage, STORAGE_SCHEMA_KEY);
  const version = Number(versionRaw);
  if (version >= STORAGE_SCHEMA_VERSION) return false;

  const dayStatsRaw = safeGet(storage, "minday.progress");
  if (dayStatsRaw) {
    try {
      const parsed: unknown = JSON.parse(dayStatsRaw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>;
        if (record.awardedTasks === undefined) record.awardedTasks = [];
        if (record.bestStreak === undefined) record.bestStreak = 0;
        if (record.days === undefined) record.days = {};
        if (!safeSet(storage, "minday.progress", JSON.stringify(record))) return false;
      }
    } catch {
      return false;
    }
  }

  return safeSet(storage, STORAGE_SCHEMA_KEY, String(STORAGE_SCHEMA_VERSION));
}
