"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props {
  redirectTo?: string;
}

export function SocialLoginButtons({ redirectTo }: Props = {}) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    const supabase = createClient();
    setIsLoading(provider);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (redirectTo) {
      callbackUrl.searchParams.set("next", redirectTo);
    }

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading !== null}
      >
        {isLoading === "google" ? (
          "연결 중..."
        ) : (
          <>
            <GoogleIcon className="mr-2 h-4 w-4" />
            구글로 계속하기
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full bg-[#FEE500] text-[#3C1E1E] border-[#FEE500] hover:bg-[#FDD800] hover:border-[#FDD800]"
        onClick={() => handleSocialLogin("kakao")}
        disabled={isLoading !== null}
      >
        {isLoading === "kakao" ? (
          "연결 중..."
        ) : (
          <>
            <KakaoIcon className="mr-2 h-4 w-4" />
            카카오로 계속하기
          </>
        )}
      </Button>
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      style={{ color: "currentcolor" }}
    >
      <path
        d="M8.15991 6.54543V9.64362H12.4654C12.2763 10.64 11.709 11.4837 10.8581 12.0509L13.4544 14.0655C14.9671 12.6692 15.8399 10.6182 15.8399 8.18188C15.8399 7.61461 15.789 7.06911 15.6944 6.54552L8.15991 6.54543Z"
        fill="#4285F4"
      />
      <path
        d="M3.6764 9.52268L3.09083 9.97093L1.01807 11.5855C2.33443 14.1963 5.03241 16 8.15966 16C10.3196 16 12.1305 15.2873 13.4542 14.0655L10.8578 12.0509C10.1451 12.5309 9.23598 12.8219 8.15966 12.8219C6.07967 12.8219 4.31245 11.4182 3.67967 9.5273L3.6764 9.52268Z"
        fill="#34A853"
      />
      <path
        d="M1.01803 4.41455C0.472607 5.49087 0.159912 6.70543 0.159912 7.99995C0.159912 9.29447 0.472607 10.509 1.01803 11.5854C1.01803 11.5926 3.6799 9.51991 3.6799 9.51991C3.5199 9.03991 3.42532 8.53085 3.42532 7.99987C3.42532 7.46889 3.5199 6.95983 3.6799 6.47983L1.01803 4.41455Z"
        fill="#FBBC05"
      />
      <path
        d="M8.15982 3.18545C9.33802 3.18545 10.3853 3.59271 11.2216 4.37818L13.5125 2.0873C12.1234 0.792777 10.3199 0 8.15982 0C5.03257 0 2.33443 1.79636 1.01807 4.41455L3.67985 6.48001C4.31254 4.58908 6.07983 3.18545 8.15982 3.18545Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.67 6.75l-.95 3.53c-.08.29.25.52.5.35l4.18-2.74c.53.07 1.07.11 1.6.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
      />
    </svg>
  );
}
