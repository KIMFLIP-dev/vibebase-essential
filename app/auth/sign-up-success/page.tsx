import Link from "next/link";
import { Mail } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-svh bg-[#F9F9FB] flex flex-col items-center justify-center p-6 md:p-10 font-sans">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="bg-white rounded-2xl border border-[#111] p-8 text-center">
          <div className="w-16 h-16 bg-[#B7B2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#111]" />
          </div>
          <h2 className="text-xl font-black text-[#111] mb-2">가입해 주셔서 감사합니다!</h2>
          <p className="text-sm text-gray-500 mb-6">
            이메일로 인증 링크를 보내드렸습니다. 이메일을 확인하고 계정을 인증해주세요.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-[#111] text-white font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
