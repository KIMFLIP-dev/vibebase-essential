import { z } from "zod";

// =====================================================
// 환경 변수 부팅 검증 (next.config.ts에서 호출)
// - 개발(dev): 누락 키를 경고로만 알린다 — 일부만 채워도 서버는 뜬다.
//   (결제 등 해당 기능을 실제 사용할 때만 값이 필요)
// - 프로덕션(build/start): 누락 시 즉시 실패 — 오설정 배포 방지
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
// (protocol 강제: "localhost:3000" 같은 스킴 빠진 오타도 잡는다)
const formatSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .url({ protocol: /^https?$/, error: "http(s):// 로 시작하는 URL이어야 합니다" })
    .optional(),
  NEXT_PUBLIC_SITE_URL: z
    .url({
      protocol: /^https?$/,
      error: "http(s):// 로 시작하는 URL이어야 합니다 (예: https://example.com)",
    })
    .optional(),
});

function isSet(value: string | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

export function validateEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return;
  }

  const missing = REQUIRED_KEYS.filter((key) => !isSet(process.env[key]));
  const isProduction = process.env.NODE_ENV === "production";

  if (missing.length > 0) {
    const list = missing.map((key) => `  - ${key}`).join("\n");

    // 프로덕션은 fail-fast — 깨진 앱이 배포되는 것을 막는다
    if (isProduction) {
      throw new Error(
        "\n❌ [env] 필수 환경 변수가 누락되었습니다:\n" +
          list +
          "\n배포 환경 변수 설정을 확인하세요." +
          "\n(.env.example에 전체 목록과 발급처가 안내되어 있습니다)\n"
      );
    }

    // 개발은 경고만 — 없는 값은 해당 기능(결제/웹훅 등)을 쓸 때만 필요하다
    console.warn(
      "\n⚠️  [env] 아직 설정되지 않은 환경 변수가 있습니다 (개발 모드라 계속 진행):\n" +
        list +
        "\n관련 기능 사용 시 .env.local에 값을 채우세요. (.env.example 참고)\n"
    );
  }

  // 값이 채워진 키의 형식 검증 (dev/prod 공통 — 오타는 바로 알려준다).
  // .env 파일의 `KEY=` 같은 빈 값은 undefined로 바꿔 검증에서 제외한다.
  const result = formatSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: isSet(process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : undefined,
    NEXT_PUBLIC_SITE_URL: isSet(process.env.NEXT_PUBLIC_SITE_URL)
      ? process.env.NEXT_PUBLIC_SITE_URL
      : undefined,
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
