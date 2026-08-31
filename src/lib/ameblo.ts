import "server-only";

// 料理ブログ記事のURLからタイトル・本文テキスト・アイキャッチ画像を取り出す。
// Ameblo（ameblo.jp）は記事本文 <div id="entryBody"> を確実に抜き出す。
// それ以外のブログは <body> 全体をテキスト化する汎用フォールバックで対応する。
// 公式APIは無いので fetch + 正規表現でパースする（HTMLパーサ依存は追加しない）。

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// フォールバックでテキスト化する際の上限（Geminiのプロンプトが長すぎると解析精度が落ちるため）。
const MAX_FALLBACK_TEXT = 8000;

export type BlogArticle = {
  title: string;
  text: string;
  imageUrl: string | null;
  canonicalUrl: string;
  isAmeblo: boolean;
};

// ameblo.jp の記事URL（/<blog>/entry-<digits>.html）を、クエリ・ハッシュを除いた正規形に直す。
// 重複チェックのキーを安定させるのが目的。ameblo.jp 以外は null。
export function normalizeAmebloUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "ameblo.jp") return null;
    const match = u.pathname.match(/^\/([^/]+)\/entry-(\d+)\.html$/);
    if (!match) return null;
    return `https://ameblo.jp/${match[1]}/entry-${match[2]}.html`;
  } catch {
    return null;
  }
}

// http(s) のURLとして解釈できれば true（汎用フォールバック用の緩い判定）。
export function isBlogUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// 属性順に依存せず <meta property="og:xxx" content="..."> を拾う。
function readOgMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${property}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

// HTML断片を、改行を保った素のテキストに変換する。
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      // 関連記事カードなど、レシピ本文でない埋め込みブロックを丸ごと除去。
      .replace(/<div class="ogpCard_root"[\s\S]*?<\/div>\s*<\/div>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Amebloの記事本文 <div ... id="entryBody"> の innerHTML を取り出す。
function extractAmebloBody(html: string): string | null {
  const start = html.search(/<div[^>]*\bid="entryBody"[^>]*>/i);
  if (start === -1) return null;
  const openTag = html.slice(start).match(/<div[^>]*\bid="entryBody"[^>]*>/i);
  if (!openTag) return null;
  const i = start + openTag[0].length;
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = i;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html))) {
    if (m[0].startsWith("</")) {
      depth--;
      if (depth === 0) return html.slice(i, m.index);
    } else {
      depth++;
    }
  }
  return html.slice(i);
}

export async function fetchBlogArticle(url: string): Promise<BlogArticle> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "ja" },
  });
  if (!res.ok) {
    throw new Error(`記事の取得に失敗した（HTTP ${res.status}）`);
  }
  const html = await res.text();

  const ogTitle = readOgMeta(html, "title");
  const titleTag = html.match(/<title>([^<]*)<\/title>/i)?.[1];
  const title = (ogTitle ?? (titleTag ? decodeEntities(titleTag) : "") ?? "").trim();

  const imageUrl = readOgMeta(html, "image");
  const canonicalUrl = readOgMeta(html, "url") || url;

  const amebloBody = extractAmebloBody(html);
  let text: string;
  let isAmeblo = false;
  if (amebloBody) {
    isAmeblo = true;
    text = htmlToText(amebloBody);
  } else {
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
    text = htmlToText(body).slice(0, MAX_FALLBACK_TEXT);
  }

  if (!text.trim()) {
    throw new Error("記事本文を読み取れなかった");
  }

  return { title, text, imageUrl, canonicalUrl, isAmeblo };
}
