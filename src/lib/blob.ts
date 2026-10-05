export async function freshBlob(blob: Blob): Promise<Blob> {
  const buffer = await blob.arrayBuffer();
  return new Blob([buffer], { type: blob.type });
}