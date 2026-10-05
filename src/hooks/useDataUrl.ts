"use client";

import { useEffect, useState } from "react";

// Safari's IndexedDB-backed Blobs intermittently fail to load once turned
// into a long-lived object URL ("WebKitBlobResource error") — data URLs
// don't reference any blob resource once read, so there's nothing to go
// stale.
export function useDataUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!blob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to an external resource (the blob) whose presence this effect tracks
      setUrl(undefined);
      return;
    }
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled && typeof reader.result === "string") setUrl(reader.result);
    };
    reader.readAsDataURL(blob);
    return () => {
      cancelled = true;
    };
  }, [blob]);

  return url;
}
