import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <p className="text-sm text-gray-500">
      {params?.error ? `오류 코드: ${params.error}` : "알 수 없는 오류가 발생했습니다."}
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="min-h-svh bg-[#F9F9FB] flex flex-col items-center justify-center p-6 md:p-10 font-sans">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-[#111] p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-[#111] mb-2">문제가 발생했습니다</h2>
          <div className="mb-6">
            <Suspense>
              <ErrorContent searchParams={searchParams} />
            </Suspense>
          </div>
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
