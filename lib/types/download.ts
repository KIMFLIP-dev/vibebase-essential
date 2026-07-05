// =====================================================
// 다운로드 카드 (/download 페이지) 관련 타입 정의
// =====================================================

export type CardVariant = "light" | "dark";

export interface DownloadItem {
  id: string;
  title: string;
  description: string | null;
  badge_label: string | null;
  github_url: string | null;
  file_path: string | null;
  file_name: string | null;
  youtube_url: string | null;
  is_paid: boolean;
  price: number;
  currency: string;
  card_variant: CardVariant;
  download_count: number;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DownloadItemInput {
  title: string;
  description?: string | null;
  badge_label?: string | null;
  github_url?: string | null;
  youtube_url?: string | null;
  is_paid?: boolean;
  price?: number;
  currency?: string;
  card_variant?: CardVariant;
  display_order?: number;
  is_published?: boolean;
}
