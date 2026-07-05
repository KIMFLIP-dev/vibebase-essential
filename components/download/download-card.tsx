import Link from "next/link";
import { Download } from "lucide-react";
import type { DownloadItem } from "@/lib/types/download";
import { YoutubeThumbnailBadge } from "./youtube-thumbnail-badge";
import { FileDownloadButton } from "./file-download-button";
import { GithubLoginPromptButton } from "./github-link-button";
import { cn } from "@/lib/utils";

interface Props {
  item: DownloadItem;
  isAuthenticated: boolean;
}

function formatRegisteredDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export function DownloadCard({ item, isAuthenticated }: Props) {
  const isDark = item.card_variant === "dark";
  const hasGithub = !!item.github_url;
  const hasFile = !!item.file_path;

  if (!hasGithub && !hasFile && !item.is_paid) return null;

  const cardClass = isDark
    ? "bg-[#111] text-white border-[#111]"
    : "bg-white text-[#111] border-[#111]";

  const titleClass = isDark ? "text-white" : "text-[#111]";
  const descClass = isDark ? "text-gray-300" : "text-[#111]";
  const dateClass = isDark ? "text-gray-500" : "text-gray-500";

  const categoryBadgeClass = isDark
    ? "bg-[#B7B2FF] text-white"
    : "bg-[#B7B2FF]/15 text-[#111]";

  const primaryBtnClass = isDark
    ? "bg-white text-[#111]"
    : "bg-[#111] text-white";

  const secondaryBtnClass = isDark
    ? "bg-transparent border border-white text-white"
    : "bg-white border border-[#111] text-[#111]";

  return (
    <div className={cn("relative rounded-2xl border p-8", cardClass)}>
      {item.youtube_url && (
        <YoutubeThumbnailBadge url={item.youtube_url} variant={item.card_variant} />
      )}

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {item.badge_label && (
          <span
            className={cn(
              "inline-block px-3 py-1 rounded-full text-xs font-bold",
              categoryBadgeClass
            )}
          >
            {item.badge_label}
          </span>
        )}
        {item.is_paid && (
          <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B35] text-white text-xs font-bold">
            유료
          </span>
        )}
      </div>

      <h2 className={cn("text-2xl font-black mb-2", titleClass)}>{item.title}</h2>

      {item.description && (
        <p className={cn("text-sm font-semibold mb-2", descClass)}>{item.description}</p>
      )}

      <div className={cn("text-xs mb-6", dateClass)}>
        등록일 {formatRegisteredDate(item.created_at)}
        {item.is_paid && (
          <span className="ml-3 font-bold text-base text-current">
            ₩{Number(item.price).toLocaleString()}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {hasGithub && isAuthenticated && (
          <Link
            href={item.github_url!}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-4 rounded-full hover:scale-105 transition-transform cursor-pointer",
              primaryBtnClass
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub에서 보기
          </Link>
        )}

        {hasGithub && !isAuthenticated && (
          <GithubLoginPromptButton
            className={cn(
              "inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-4 rounded-full hover:scale-105 transition-transform cursor-pointer",
              primaryBtnClass
            )}
          />
        )}

        {hasFile && !item.is_paid && (
          <FileDownloadButton
            itemId={item.id}
            className={cn(
              "inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-4 rounded-full hover:scale-105 transition-transform cursor-pointer",
              hasGithub ? secondaryBtnClass : primaryBtnClass
            )}
          />
        )}

        {item.is_paid && (
          <button
            type="button"
            disabled
            className={cn(
              "inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-4 rounded-full opacity-60 cursor-not-allowed",
              hasGithub ? secondaryBtnClass : primaryBtnClass
            )}
          >
            <Download size={16} />곧 출시
          </button>
        )}
      </div>
    </div>
  );
}
