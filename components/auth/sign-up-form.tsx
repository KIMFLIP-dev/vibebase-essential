"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SocialLoginButtons } from "./social-login-buttons";
import { Loader2 } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/mypage`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="bg-white rounded-2xl border border-[#111] p-8">
        <h2 className="text-xl font-black text-[#111] text-center mb-6">회원가입</h2>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Social Login */}
          <SocialLoginButtons />

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#111]/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-500">or</span>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-bold text-[#111]">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border-[#111]/20 focus:border-[#B7B2FF] focus:ring-[#B7B2FF]"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-bold text-[#111]">
              패스워드
            </label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl border-[#111]/20 focus:border-[#B7B2FF] focus:ring-[#B7B2FF]"
            />
          </div>

          {/* Repeat Password */}
          <div className="space-y-1.5">
            <label htmlFor="repeat-password" className="text-sm font-bold text-[#111]">
              패스워드 확인
            </label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="h-11 rounded-xl border-[#111]/20 focus:border-[#B7B2FF] focus:ring-[#B7B2FF]"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl p-3">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                가입 중...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>

          {/* Links */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              이미 계정이 있으신가요?{" "}
              <Link href="/auth/login" className="font-bold text-[#111] hover:text-[#B7B2FF] transition-colors">
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Terms */}
      <p className="text-center text-[10px] text-gray-400">
        가입 시{" "}
        <Link href="/legal/terms" className="underline hover:text-[#111]">서비스이용약관</Link>
        {" "}및{" "}
        <Link href="/legal/privacy" className="underline hover:text-[#111]">개인정보처리방침</Link>
        에 동의하게 됩니다.
      </p>
    </div>
  );
}
