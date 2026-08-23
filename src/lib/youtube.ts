import "server-only";

export function parseYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        return u.searchParams.get("v");
      }
      const shortsMatch = u.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = u.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return embedMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

export type YouTubeSnippet = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
};

export async function fetchVideoSnippet(videoId: string): Promise<YouTubeSnippet> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}`);
  }

  const json = (await res.json()) as {
    items?: Array<{
      snippet?: {
        title?: string;
        description?: string;
        thumbnails?: Record<string, { url?: string }>;
      };
    }>;
  };

  const item = json.items?.[0];
  if (!item?.snippet) {
    throw new Error("動画が見つからない（削除・非公開の可能性がある）");
  }

  const thumbnails = item.snippet.thumbnails ?? {};
  const thumbnailUrl =
    thumbnails.maxres?.url ?? thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url;
  if (!thumbnailUrl) {
    throw new Error("サムネイルが取得できなかった");
  }

  return {
    videoId,
    title: item.snippet.title ?? "",
    description: item.snippet.description ?? "",
    thumbnailUrl,
  };
}
