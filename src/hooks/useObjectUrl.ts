"use client";

import { getCachedObjectUrl } from "@/lib/object-url-cache";

export function useObjectUrl(key: string | undefined, blob: Blob | undefined): string | undefined {
  return key ? getCachedObjectUrl(key, blob) : undefined;
}
