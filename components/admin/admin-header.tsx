"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/types/admin";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "대시보드",
  "/admin/users": "회원 관리",
  "/admin/products": "상품 관리",
  "/admin/purchases": "구매 내역",
  "/admin/inquiries": "문의 관리",
  "/admin/downloads": "다운로드 관리",
  "/admin/posts": "블로그 관리",
  "/admin/settings": "설정",
};

const roleLabels: Record<UserRole, string> = {
  user: "일반 사용자",
  admin: "관리자",
  super_admin: "최고 관리자",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  if (pathname.startsWith("/admin/users/")) {
    return "회원 상세";
  }

  return "관리자";
}

export function AdminHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserRole>("user");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email || "");
        setRole((data.user.app_metadata?.role as UserRole) || "user");
      }
    });
  }, []);

  return (
    <header className="h-14 border-b px-6 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={role === "super_admin" ? "destructive" : "default"}>
            {roleLabels[role]}
          </Badge>
          <span className="text-sm text-muted-foreground">{email}</span>
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
