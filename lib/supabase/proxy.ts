import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  // /admin/* 경로 보호 - 관리자 권한 체크
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      const fullPath = pathname + request.nextUrl.search;
      url.pathname = "/auth/login";
      url.search = "";
      url.searchParams.set("redirect", fullPath);
      return NextResponse.redirect(url);
    }

    // role은 app_metadata에서만 읽는다 (user_metadata는 사용자 수정 가능)
    const appMetadata = user.app_metadata as { role?: string };
    const role = appMetadata?.role;

    if (role !== "admin" && role !== "super_admin") {
      // 권한 없음 - 홈으로 리다이렉트
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // 정적 파일은 인증 체크 제외
  const isStaticFile = /\.(png|jpg|jpeg|gif|svg|ico|webp|avif|css|js|woff|woff2|ttf|eot|mp4|webm|ogg|mp3)$/i.test(pathname);

  // 일반 보호된 경로 체크
  if (
    pathname !== "/" &&
    !user &&
    !isStaticFile &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/legal") &&
    !pathname.startsWith("/products") &&
    !pathname.startsWith("/download") &&
    !pathname.startsWith("/blog") &&
    !pathname.startsWith("/api/downloads") &&
    !pathname.startsWith("/api/webhooks")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    const fullPath = pathname + request.nextUrl.search;
    url.pathname = "/auth/login";
    url.search = "";
    url.searchParams.set("redirect", fullPath);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
