import Image from "next/image";
import type { Recipe } from "@/lib/types";

function youtubeEmbedUrl(sourceUrl: string): string | null {
  try {
    const u = new URL(sourceUrl);
    const videoId = u.searchParams.get("v");
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

function instagramEmbedUrl(sourceUrl: string): string | null {
  try {
    const u = new URL(sourceUrl);
    const match = u.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);
    if (!match) return null;
    return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
  } catch {
    return null;
  }
}

export function SourceEmbed({ recipe }: { recipe: Recipe }) {
  if (recipe.source_type === "youtube" && recipe.source_url) {
    const embed = youtubeEmbedUrl(recipe.source_url);
    if (embed) {
      return (
        <div className="aspect-video overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <iframe src={embed} className="h-full w-full" title="動画" allowFullScreen />
        </div>
      );
    }
  }

  if (recipe.source_type === "instagram" && recipe.source_url) {
    const embed = instagramEmbedUrl(recipe.source_url);
    if (embed) {
      return (
        <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <iframe src={embed} className="h-[520px] w-full" title="Instagram投稿" />
        </div>
      );
    }
  }

  if (recipe.thumbnail_url) {
    return (
      <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
        <Image
          src={recipe.thumbnail_url}
          alt={recipe.title}
          width={800}
          height={450}
          className="h-auto w-full object-cover"
        />
      </div>
    );
  }

  return null;
}
