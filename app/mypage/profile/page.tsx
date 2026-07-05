"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Loader2, CheckCircle, Camera } from "lucide-react";
import { toast } from "sonner";
import {
  uploadAvatar,
  getMyConsent,
  updateMarketingConsent,
  deleteMyAccount,
} from "@/app/mypage/actions";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setAvatarUrl(user.user_metadata?.avatar_url || null);

      const consent = await getMyConsent();
      setMarketingOptIn(consent?.marketing_opt_in ?? false);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const result = await uploadAvatar(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
        setAvatarBroken(false);
        toast.success("프로필 이미지가 변경되었습니다.");
      }
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMarketingToggle = async (checked: boolean) => {
    setMarketingOptIn(checked);
    const result = await updateMarketingConsent(checked);
    if (result.error) {
      setMarketingOptIn(!checked);
      toast.error(result.error);
    } else {
      toast.success(
        checked ? "마케팅 수신에 동의했습니다." : "마케팅 수신 동의를 철회했습니다."
      );
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteMyAccount();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsDeleting(false);
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

      {/* 프로필 이미지 */}
      <div className="bg-white rounded-2xl border border-[#111] p-8 mb-6">
        <h2 className="text-sm font-bold text-[#111] mb-4">프로필 이미지</h2>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20">
            {avatarUrl && !avatarBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="프로필 이미지"
                className="w-20 h-20 rounded-full object-cover border border-[#111]/10"
                // 구글 아바타는 Referer가 붙으면 간헐 403 — no-referrer 필수
                referrerPolicy="no-referrer"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#B7B2FF]/10 flex items-center justify-center">
                <User className="w-8 h-8 text-[#B7B2FF]" />
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#111] text-[#111] font-bold text-sm hover:bg-[#111] hover:text-white transition-colors disabled:opacity-50"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              이미지 변경
            </button>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP · 최대 2MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl border border-[#111] p-8 mb-6">
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

      {/* 마케팅 수신 동의 */}
      <div className="bg-white rounded-2xl border border-[#111] p-8 mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={marketingOptIn}
            onCheckedChange={(checked) => handleMarketingToggle(checked === true)}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-bold text-[#111]">마케팅 정보 수신 동의</p>
            <p className="text-xs text-gray-400 mt-1">
              이벤트·프로모션 소식을 이메일로 받아볼 수 있습니다. 언제든 철회할 수 있습니다.
            </p>
          </div>
        </label>
      </div>

      {/* 회원 탈퇴 */}
      <div className="bg-white rounded-2xl border border-red-200 p-8">
        <h2 className="text-sm font-bold text-red-600 mb-2">회원 탈퇴</h2>
        <p className="text-xs text-gray-500 mb-4">
          탈퇴 시 계정과 개인정보가 삭제됩니다. 결제·거래 기록은 관련 법령에 따라
          일정 기간 보존됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="px-5 py-2.5 rounded-full border border-red-500 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-colors"
            >
              탈퇴하기
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                계정과 개인정보가 즉시 삭제되며 되돌릴 수 없습니다. 구매하신
                상품에 대한 접근 권한도 함께 사라집니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    처리 중...
                  </span>
                ) : (
                  "탈퇴하기"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
