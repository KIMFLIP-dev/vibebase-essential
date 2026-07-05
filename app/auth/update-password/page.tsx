import Link from "next/link";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function Page() {
  return (
    <div className="min-h-svh bg-[#F9F9FB] flex flex-col items-center justify-center p-6 md:p-10 font-sans">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#B7B2FF] rounded-xl flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m16 18 6-6-6-6" />
                <path d="m8 6-6 6 6 6" />
              </svg>
            </div>
            <span className="text-xl tracking-tight text-[#111] italic">
              김플립의 <span className="font-black">VibeBase</span>
            </span>
          </Link>
        </div>

        <UpdatePasswordForm />
      </div>
    </div>
  );
}
