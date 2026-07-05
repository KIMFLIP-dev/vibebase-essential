// =====================================================
// 블로그 글 (/blog 페이지) 관련 타입 정의
// =====================================================

export type PostStatus = "draft" | "published";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string;
  cover_image_url: string | null;
  tags: string[];
  status: PostStatus;
  view_count: number;
  published_at: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PostInput {
  title: string;
  slug?: string; // 비우면 title에서 자동 생성
  excerpt?: string | null;
  content_md?: string;
  cover_image_url?: string | null;
  tags?: string[];
  status?: PostStatus;
  display_order?: number;
}
