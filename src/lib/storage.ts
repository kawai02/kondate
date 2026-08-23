import "server-only";
import { getSupabase } from "@/lib/supabase";

const BUCKET = "recipe-images";

function extensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export async function uploadImageBuffer(
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const supabase = getSupabase();
  const ext = extensionFromContentType(contentType);
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImageFromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`画像の取得に失敗した: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return uploadImageBuffer(buffer, contentType);
}
