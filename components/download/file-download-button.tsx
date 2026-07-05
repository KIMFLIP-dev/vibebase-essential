"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  itemId: string;
  className: string;
}

export function FileDownloadButton({ itemId, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(false);

  const handleClick = async () => {
    setIsChecking(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인이 필요합니다.");
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      window.location.href = `/api/downloads/${itemId}/file`;
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isChecking}
      className={cn(className, "disabled:opacity-60")}
    >
      <Download size={16} />
      파일 다운로드
    </button>
  );
}
