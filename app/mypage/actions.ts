"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserConsent } from "@/lib/types/consent";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// 프로필 아바타 업로드 → avatars 공개 버킷 + user_metadata.avatar_url
export async function uploadAvatar(
  formData: FormData
): Promise<{ avatarUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "이미지 파일을 선택해주세요." };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { error: "이미지는 2MB 이하만 업로드할 수 있습니다." };
  }

  const extension = ALLOWED_AVATAR_TYPES[file.type];
  if (!extension) {
    return { error: "JPG, PNG, WebP 형식만 지원합니다." };
  }

  const adminClient = createAdminClient();
  const filePath = `${user.id}/avatar.${extension}`;

  const { error: uploadError } = await adminClient.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("[아바타] 업로드 실패:", uploadError);
    return { error: "업로드에 실패했습니다." };
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from("avatars").getPublicUrl(filePath);

  // 캐시 무효화를 위해 버전 쿼리 부착
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  if (updateError) {
    console.error("[아바타] 프로필 반영 실패:", updateError);
    return { error: "프로필 반영에 실패했습니다." };
  }

  return { avatarUrl };
}

// 내 동의 상태 조회 (마케팅 토글 표시용)
export async function getMyConsent(): Promise<UserConsent | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("user_consents")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as UserConsent) || null;
}

// 마케팅 수신 동의 토글 (필수 동의 일시는 건드리지 않는다 — service_role 전용 쓰기)
export async function updateMarketingConsent(
  optIn: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  // UPDATE만 수행한다 — upsert로 새 행을 만들면 필수 동의 시각이
  // DEFAULT NOW()(= 토글 시각)로 위조 기록되어 법적 증빙이 훼손된다.
  const { data: updated, error } = await adminClient
    .from("user_consents")
    .update({ marketing_opt_in: optIn, marketing_updated_at: now })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (error) {
    console.error("[동의] 마케팅 수신 변경 실패:", error);
    return { error: "변경에 실패했습니다." };
  }

  if (!updated) {
    console.warn("[동의] 마케팅 토글 대상 동의 행 없음:", user.id);
    return { error: "동의 정보를 찾을 수 없습니다. 다시 로그인 후 시도해주세요." };
  }

  return {};
}

// 회원 탈퇴 — 계정 삭제. 거래 기록(product_purchases)은 FK ON DELETE SET NULL로
// 보존되고(전자상거래법 보존 의무), 문의·동의 기록은 CASCADE로 함께 삭제된다.
export async function deleteMyAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[탈퇴] 계정 삭제 실패:", error);
    return { error: "탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  // 로컬 세션(쿠키)만 정리 — 계정이 이미 삭제돼 전역 토큰 폐기는 실패한다
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});

  return {};
}
