import { createClient } from "@/lib/supabase/server";
import { ensureFirstAdmin } from "@/lib/admin/bootstrap";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // ADMIN_EMAIL과 일치하면 첫 관리자 자동 부여 (가입 시점에 ADMIN_EMAIL이
      // 없었던 계정도 확인 링크를 거치며 승격되도록 여기서도 확인)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const promoted = await ensureFirstAdmin(user);
        if (promoted) {
          await supabase.auth.refreshSession();
        }
      }

      // redirect user to specified redirect URL or root of app
      redirect(next);
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
