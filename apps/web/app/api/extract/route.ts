import { extractText } from "@/lib/server/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "missing file" }, { status: 400 });
  }
  const buf = await file.arrayBuffer();
  const text = await extractText(file.name, buf);
  return Response.json({ text, filename: file.name });
}
