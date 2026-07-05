// =====================================================
// 1:1 문의 관련 타입 정의
// =====================================================

export type InquiryStatus = "open" | "answered" | "closed";

export interface Inquiry {
  id: string;
  user_id: string;
  title: string;
  message: string;
  status: InquiryStatus;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;

  // 조인 데이터 (어드민 목록용)
  user?: {
    email: string;
  };
}
