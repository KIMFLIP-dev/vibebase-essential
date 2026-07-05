import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from "@/lib/youtube";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  url: string;
  variant?: "light" | "dark";
}

export function YoutubeThumbnailBadge({ url, variant = "light" }: Props) {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) return null;

  const containerClass =
    variant === "dark"
      ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
      : "bg-white border-[#111] text-[#111] hover:bg-gray-50";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="YouTube 영상 보기"
      className={cn(
        "absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center gap-1.5 sm:gap-2 border rounded-xl sm:rounded-2xl p-1 sm:p-1.5 pr-2 sm:pr-3 transition-all hover:scale-105 shadow-sm",
        containerClass
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getYoutubeThumbnailUrl(videoId)}
        alt=""
        width={60}
        height={40}
        className="w-[40px] h-[27px] sm:w-[60px] sm:h-[40px] object-cover rounded-md sm:rounded-lg"
        loading="lazy"
      />
      <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold whitespace-nowrap">
        <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#FF0000] text-white">
          <Play size={8} fill="white" strokeWidth={0} className="sm:hidden" />
          <Play size={10} fill="white" strokeWidth={0} className="hidden sm:block" />
        </span>
        <span className="hidden sm:inline">영상보기</span>
      </span>
    </a>
  );
}
