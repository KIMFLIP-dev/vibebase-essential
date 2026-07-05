// =====================================================
// 약관·마케팅 동의 기록 타입 정의
// =====================================================

export interface UserConsent {
  user_id: string;
  terms_agreed_at: string;
  privacy_agreed_at: string;
  marketing_opt_in: boolean;
  marketing_updated_at: string | null;
  created_at: string;
  updated_at: string;
}
