/**
 * Persistent Storage Service
 * Generic localStorage CRUD with type safety.
 * All data survives page refresh.
 */

const PREFIX = "rn_"; // residential nexus prefix

// ─── helpers ───────────────────────────────────────────────────
function key(collection: string) {
  return `${PREFIX}${collection}`;
}

export function getCollection<T>(collection: string): T[] {
  try {
    const raw = localStorage.getItem(key(collection));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCollection<T>(collection: string, data: T[]): void {
  localStorage.setItem(key(collection), JSON.stringify(data));
}

export function getItem<T extends { id: string }>(collection: string, id: string): T | undefined {
  return getCollection<T>(collection).find((item) => item.id === id);
}

export function addItem<T extends { id: string }>(collection: string, item: T): T {
  const items = getCollection<T>(collection);
  items.push(item);
  setCollection(collection, items);
  return item;
}

export function updateItem<T extends { id: string }>(
  collection: string,
  id: string,
  patch: Partial<T>
): T | undefined {
  const items = getCollection<T>(collection);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...patch };
  setCollection(collection, items);
  return items[idx];
}

export function deleteItem<T extends { id: string }>(collection: string, id: string): boolean {
  const items = getCollection<T>(collection);
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  setCollection(collection, filtered);
  return true;
}

export function getValue<T>(storageKey: string): T | null {
  try {
    const raw = localStorage.getItem(key(storageKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setValue<T>(storageKey: string, data: T): void {
  localStorage.setItem(key(storageKey), JSON.stringify(data));
}

/**
 * Seed a collection with default data if it doesn't already exist.
 * Returns true if seeded, false if data already existed.
 */
export function seedIfEmpty<T>(collection: string, defaultData: T[]): boolean {
  const existing = localStorage.getItem(key(collection));
  if (!existing || existing === "[]") {
    setCollection(collection, defaultData);
    return true;
  }
  return false;
}

export function generateId(prefix: string = ""): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
