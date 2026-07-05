import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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
  const { error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.warn("[Auth Callback] getUser failed:", userError.message);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
