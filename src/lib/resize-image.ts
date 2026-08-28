// ブラウザ側で使う純クライアント関数（server-onlyではない）。
// Server Actionのボディ上限（next.config.tsで4mbに拡張）に収めるため、
// アップロード前に長辺1280px・JPEG品質0.75まで縮小する。
// 写真取り込み（recipes/import/photo）と感想記録の完成写真アップロードで共用する。
export async function resizeImage(file: File): Promise<File> {
  // スマホ写真はEXIFのorientationで「横向き」として保存されることが多い。
  // imageOrientation: "from-image" でEXIFの回転をピクセルに焼き込んでから縮小し、
  // 取り込み後は常に正しい向きで表示されるようにする。
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas未対応");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.75)
  );
  if (!blob) throw new Error("画像の変換に失敗した");

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}
