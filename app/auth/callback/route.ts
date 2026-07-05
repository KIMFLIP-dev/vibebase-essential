import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureFirstAdmin } from "@/lib/admin/bootstrap";

// Open Redirect 방지를 위한 검증
function isValidRedirect(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.toLowerCase().includes("%2f%2f")) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/mypage";
  const next = isValidRedirect(nextParam) ? nextParam : "/mypage";

  if (!code) {
    console.error("[Auth Callback] Missing code parameter");
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Auth Callback] Missing Supabase environment variables");
    return NextResponse.redirect(`${origin}/auth/error?reason=config_error`);
  }

  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach((cookie) => cookiesToSet.push(cookie));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Auth Callback] Code exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange_failed`);
  }

  // 세션 쿠키 설정을 위해 사용자 정보 조회
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.warn("[Auth Callback] getUser failed:", userError.message);
  }

  // 소셜 로그인 가입자 동의 기록 백필 — 가입 폼을 거치지 않으므로
  // 첫 로그인 시점에 기본 동의 행을 만든다 (가입 UI에 "소셜 로그인 시
  // 약관 동의 간주" 고지 있음). 이미 있으면 건드리지 않는다.
  if (userData?.user) {
    try {
      const adminClient = createAdminClient();
      await adminClient.from("user_consents").upsert(
        {
          user_id: userData.user.id,
          terms_agreed_at: new Date().toISOString(),
          privacy_agreed_at: new Date().toISOString(),
          marketing_opt_in: false,
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
    } catch (consentError) {
      console.error("[Auth Callback] 동의 기록 백필 실패:", consentError);
    }

    // ADMIN_EMAIL과 일치하면 첫 관리자 자동 부여.
    // 부여됐으면 세션을 갱신해 이번 로그인의 JWT에 role을 즉시 반영한다.
    const promoted = await ensureFirstAdmin(userData.user);
    if (promoted) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn(
          "[Auth Callback] 세션 갱신 실패 (재로그인 시 role 반영됨):",
          refreshError.message
        );
      }
    }
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
