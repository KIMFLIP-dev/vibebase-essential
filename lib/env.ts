import { z } from "zod";

// =====================================================
// 환경 변수 부팅 검증 (next.config.ts에서 호출)
// - 필수 키가 전부 비어 있으면: 최초 설정 전 상태로 보고 경고만 출력
// - 일부만 비어 있으면: 누락 목록을 담아 즉시 실패 (설정 실수 조기 발견)
// - SKIP_ENV_VALIDATION=1 이면 건너뜀 (CI 등 시크릿 없는 빌드용)
// =====================================================

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_PORTONE_STORE_ID",
  "NEXT_PUBLIC_PORTONE_CHANNEL_KEY",
  "PORTONE_API_SECRET",
  "PORTONE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SITE_URL",
] as const;

// 값이 존재할 때만 형식을 검증하는 스키마
const formatSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ error: "유효한 URL이어야 합니다" }).optional(),
  NEXT_PUBLIC_SITE_URL: z.url({ error: "유효한 URL이어야 합니다 (예: https://example.com)" }).optional(),
});

function isSet(value: string | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

export function validateEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return;
  }

  const missing = REQUIRED_KEYS.filter((key) => !isSet(process.env[key]));

  // 전부 비어 있으면 최초 클론 직후로 간주 — 앱은 뜨되 안내만 남긴다.
  // 단, 프로덕션 빌드/실행에서는 오설정 배포를 막기 위해 즉시 실패시킨다.
  const isProduction = process.env.NODE_ENV === "production";
  if (missing.length === REQUIRED_KEYS.length && !isProduction) {
    console.warn(
      "\n⚠️  [env] 환경 변수가 설정되지 않았습니다. " +
        ".env.example을 .env.local로 복사한 뒤 값을 채우세요.\n"
    );
    return;
  }

  if (missing.length > 0) {
    throw new Error(
      "\n❌ [env] 필수 환경 변수가 누락되었습니다:\n" +
        missing.map((key) => `  - ${key}`).join("\n") +
        "\n.env.local(로컬) 또는 배포 환경 변수 설정을 확인하세요." +
        "\n(.env.example에 전체 목록과 발급처가 안내되어 있습니다)\n"
    );
  }

  // 값이 채워진 키의 형식 검증
  const result = formatSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!result.success) {
    throw new Error(
      "\n❌ [env] 환경 변수 형식이 올바르지 않습니다:\n" +
        result.error.issues
          .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
          .join("\n") +
        "\n"
    );
  }
}

// 이메일 발송(Resend)은 옵셔널 — 두 키가 모두 있어야 발송한다
export function isEmailConfigured(): boolean {
  return isSet(process.env.RESEND_API_KEY) && isSet(process.env.EMAIL_FROM);
}
