// =====================================================
// Vimeo oEmbed API 헬퍼
// API 키 불필요, 공개/비공개(unlisted) 영상 지원
// =====================================================

export interface VimeoOembedResponse {
  type: string;
  version: string;
  title: string;
  author_name: string;
  author_url: string;
  provider_name: string;
  provider_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  duration: number; // seconds
  width: number;
  height: number;
  video_id: number;
}

export interface VimeoMetadata {
  title: string;
  thumbnail_url: string;
  duration_seconds: number;
}

/**
 * Vimeo oEmbed API로 영상 메타데이터(썸네일, 길이) 조회
 * @param videoId Vimeo 비디오 ID (예: "123456789")
 */
export async function getVimeoMetadata(
  videoId: string
): Promise<VimeoMetadata> {
  const url = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vibebase.dev";
  const response = await fetch(url, {
    headers: { Referer: siteUrl },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(
      `Vimeo oEmbed 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: VimeoOembedResponse = await response.json();

  return {
    title: data.title,
    thumbnail_url: data.thumbnail_url,
    duration_seconds: data.duration,
  };
}

/**
 * 초(seconds)를 "MM:SS" 형식으로 변환
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 총 초를 "N시간 M분" 형식으로 변환
 */
export function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
}
