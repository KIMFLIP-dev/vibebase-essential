"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { SocialLoginButtons } from "./social-login-buttons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface LoginFormProps extends React.ComponentProps<"div"> {
  redirectTo?: string;
}

export function LoginForm({
  className,
  redirectTo = "/mypage/courses",
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push(redirectTo);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="bg-white rounded-2xl border border-[#111] p-8">
        <h2 className="text-xl font-black text-[#111] text-center mb-6">로그인</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Social Login */}
          <SocialLoginButtons redirectTo={redirectTo} />

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
                로그인 중...
              </span>
            ) : (
              "Login"
            )}
          </button>

          {/* Links */}
          <div className="text-center space-y-2 pt-2">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-gray-500 hover:text-[#111] transition-colors"
            >
              비밀번호를 잊으셨나요?
            </Link>
            <p className="text-xs text-gray-500">
              아직 무료회원이 아니신가요?{" "}
              <Link href="/auth/sign-up" className="font-bold text-[#111] hover:text-[#B7B2FF] transition-colors">
                회원가입
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Terms */}
      <p className="text-center text-[10px] text-gray-400">
        로그인 시{" "}
        <Link href="/legal/terms" className="underline hover:text-[#111]">서비스이용약관</Link>
        {" "}및{" "}
        <Link href="/legal/privacy" className="underline hover:text-[#111]">개인정보처리방침</Link>
        에 동의하게 됩니다.
      </p>
    </div>
  );
}
