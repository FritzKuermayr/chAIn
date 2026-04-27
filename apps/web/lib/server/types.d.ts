declare module "pdf-parse/lib/pdf-parse.js" {
  function pdfParse(data: Buffer | Uint8Array): Promise<{ text: string; numpages: number }>;
  export default pdfParse;
}

declare module "mammoth" {
  export function extractRawText(input: { buffer: Buffer }): Promise<{ value: string; messages: unknown[] }>;
}
