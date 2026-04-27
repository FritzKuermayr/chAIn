export async function extractText(filename: string, buf: ArrayBuffer): Promise<string> {
  const name = (filename || "").toLowerCase();
  const bytes = new Uint8Array(buf);
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return new TextDecoder("utf-8").decode(bytes);
  }
  if (name.endsWith(".pdf")) {
    try {
      const mod = await import("pdf-parse/lib/pdf-parse.js");
      const pdfParse = (mod as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default;
      const data = await pdfParse(Buffer.from(bytes));
      return (data.text || "").trim();
    } catch (e) {
      return `[chAIn] PDF extraction failed: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  if (name.endsWith(".docx")) {
    try {
      const mod = await import("mammoth");
      const mammoth = mod as unknown as { extractRawText: (a: { buffer: Buffer }) => Promise<{ value: string }> };
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      return (result.value || "").trim();
    } catch (e) {
      return `[chAIn] DOCX extraction failed: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  return new TextDecoder("utf-8").decode(bytes);
}
