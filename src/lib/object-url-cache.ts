// IndexedDB deserializes a new Blob object on every read, even for unchanged
// records — so caching object URLs by Blob identity churns constantly under
// Dexie's live queries. Cache by the record's stable id instead.
const cache = new Map<string, string>();

export function getCachedObjectUrl(key: string, blob: Blob | undefined): string | undefined {
  if (!blob) return undefined;
  const existing = cache.get(key);
  if (existing) return existing;
  const url = URL.createObjectURL(blob);
  cache.set(key, url);
  return url;
}

export function releaseCachedObjectUrl(key: string) {
  const existing = cache.get(key);
  if (existing) {
    URL.revokeObjectURL(existing);
    cache.delete(key);
  }
}
