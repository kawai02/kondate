// ブラウザ側で使う純クライアント関数。保存済みのサムネイル画像を
// 時計回りに90°回転させ、再アップロード用のJPEG Fileにして返す。
// レシピ編集・取り込みプレビューの「回転」ボタンから使う。
export async function rotateImage90(source: Blob): Promise<File> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });

  const canvas = document.createElement("canvas");
  // 90°回転なので幅と高さが入れ替わる
  canvas.width = bitmap.height;
  canvas.height = bitmap.width;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas未対応");

  ctx.translate(canvas.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(bitmap, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );
  if (!blob) throw new Error("画像の変換に失敗した");

  return new File([blob], "rotated.jpg", { type: "image/jpeg" });
}
