"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <div className="bg-white rounded-2xl border border-[#111] p-8 text-center">
          <div className="w-16 h-16 bg-[#B7B2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#111]" />
          </div>
          <h2 className="text-xl font-black text-[#111] mb-2">이메일을 확인하세요</h2>
          <p className="text-sm text-gray-500 mb-6">
            비밀번호 재설정 링크가 이메일로 전송되었습니다.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-[#111] text-white font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#111] p-8">
          <h2 className="text-xl font-black text-[#111] text-center mb-2">비밀번호 재설정</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-4">
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

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl p-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  전송 중...
                </span>
              ) : (
                "재설정 이메일 보내기"
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                비밀번호가 기억나셨나요?{" "}
                <Link href="/auth/login" className="font-bold text-[#111] hover:text-[#B7B2FF] transition-colors">
                  로그인
                </Link>
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
