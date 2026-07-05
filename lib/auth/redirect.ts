/**
 * Open Redirect 방지: 같은 사이트 내부 경로만 허용한다.
 */
export function isValidRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.toLowerCase().includes("%2f%2f")) return false;
  // 로그인 루프 방지
  if (path.startsWith("/auth/")) return false;
  return true;
}

export const DEFAULT_LOGIN_REDIRECT = "/mypage/courses";

export function safeRedirectPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_LOGIN_REDIRECT
): string {
  return isValidRedirectPath(raw) ? raw : fallback;
}
