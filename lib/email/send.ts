import { Resend } from "resend";
import type { ReactElement } from "react";
import { isEmailConfigured } from "@/lib/env";

// =====================================================
// 트랜잭셔널 이메일 발송 래퍼 (Resend)
// - RESEND_API_KEY / EMAIL_FROM 미설정이면 조용히 스킵 (옵셔널 기능)
// - 발송 실패는 로그만 남긴다 — 결제/문의 등 본 흐름을 막지 않는다
// =====================================================

export async function sendEmail(options: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(
      `[이메일] RESEND 미설정 — 발송 건너뜀: "${options.subject}" → ${options.to}`
    );
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: options.to,
      subject: options.subject,
      react: options.react,
    });

    if (error) {
      console.error("[이메일] 발송 실패:", error);
    }
  } catch (err) {
    console.error("[이메일] 발송 오류:", err);
  }
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

// getUserById 호환 최소 타입 (구조적 타이핑 — 실제 admin 클라이언트 전달)
interface AdminAuthClient {
  auth: {
    admin: {
      getUserById(
        id: string
      ): Promise<{ data: { user: { email?: string | null } | null } }>;
    };
  };
}

// 수신자 조회 + 발송을 한 번에 감싸는 안전 헬퍼.
// 수신자 조회(getUserById)의 네트워크 실패까지 삼켜서
// 결제/환불/답변 등 본 흐름에 절대 예외를 전파하지 않는다.
export async function sendEmailToUser(
  adminClient: AdminAuthClient,
  userId: string | null | undefined,
  options: { subject: string; react: ReactElement }
): Promise<void> {
  if (!userId || !isEmailConfigured()) return;

  try {
    const { data } = await adminClient.auth.admin.getUserById(userId);
    if (data.user?.email) {
      await sendEmail({ to: data.user.email, ...options });
    }
  } catch (err) {
    console.error("[이메일] 수신자 조회/발송 오류:", err);
  }
}
