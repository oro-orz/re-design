/**
 * Node 18 等で File が未定義の場合のポリフィル。
 * Next.js の Server Action / FormData 処理で File が参照されるため、
 * ルート layout で読み込んでおく。
 */
if (typeof globalThis.File === "undefined" && typeof globalThis.Blob !== "undefined") {
  (globalThis as unknown as { File: typeof Blob }).File = globalThis.Blob;
}
