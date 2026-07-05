"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { User, Loader2, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      setEmail(user.email || "");
      setIsFetching(false);
    }
    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "업데이트에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="w-full max-w-3xl mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 text-[#B7B2FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111] flex items-center gap-3">
          <User className="h-7 w-7" />
          회원정보 수정
        </h1>
        <p className="text-gray-500 mt-2">프로필 정보를 수정합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#111] p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-bold text-[#111]">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="h-11 rounded-xl border-[#111]/20 bg-[#F9F9FB] text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">이메일은 변경할 수 없습니다.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-bold text-[#111]">
              이름
            </label>
            <Input
              id="name"
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl border-[#111]/20 focus:border-[#B7B2FF] focus:ring-[#B7B2FF]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl p-3">{error}</p>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl p-3">
              <CheckCircle className="w-4 h-4" />
              저장되었습니다.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                저장 중...
              </span>
            ) : (
              "저장하기"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
