"use server";

import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// 이메일 회원가입 + 약관·마케팅 동의 기록 (법적 증빙은 user_consents 테이블에)
export async function signUpWithConsent(input: {
  email: string;
  password: string;
  marketingOptIn: boolean;
}): Promise<{ error?: string }> {
  const { email, password, marketingOptIn } = input;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const supabase = await createClient();

  const headerList = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || headerList.get("origin") || "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/mypage`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // 동의 기록 저장 (service_role — user_consents는 클라이언트 쓰기 불가)
  // identities가 비어 있으면 기가입 이메일에 대한 obfuscated 응답이므로 스킵
  if (data.user && (data.user.identities?.length ?? 0) > 0) {
    const adminClient = createAdminClient();
    const now = new Date().toISOString();
    const { error: consentError } = await adminClient
      .from("user_consents")
      .upsert(
        {
          user_id: data.user.id,
          terms_agreed_at: now,
          privacy_agreed_at: now,
          marketing_opt_in: marketingOptIn,
          marketing_updated_at: marketingOptIn ? now : null,
        },
        { onConflict: "user_id" }
      );

    if (consentError) {
      // 가입은 성공했으므로 동의 기록 실패는 로그만 남긴다
      console.error("[가입] 동의 기록 저장 실패:", consentError);
    }
  }

  return {};
}
