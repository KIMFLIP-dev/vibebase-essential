"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, Mail } from "lucide-react";
import Link from "next/link";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16">
      <path d="M8.15991 6.54543V9.64362H12.4654C12.2763 10.64 11.709 11.4837 10.8581 12.0509L13.4544 14.0655C14.9671 12.6692 15.8399 10.6182 15.8399 8.18188C15.8399 7.61461 15.789 7.06911 15.6944 6.54552L8.15991 6.54543Z" fill="#4285F4" />
      <path d="M3.6764 9.52268L3.09083 9.97093L1.01807 11.5855C2.33443 14.1963 5.03241 16 8.15966 16C10.3196 16 12.1305 15.2873 13.4542 14.0655L10.8578 12.0509C10.1451 12.5309 9.23598 12.8219 8.15966 12.8219C6.07967 12.8219 4.31245 11.4182 3.67967 9.5273L3.6764 9.52268Z" fill="#34A853" />
      <path d="M1.01803 4.41455C0.472607 5.49087 0.159912 6.70543 0.159912 7.99995C0.159912 9.29447 0.472607 10.509 1.01803 11.5854C1.01803 11.5926 3.6799 9.51991 3.6799 9.51991C3.5199 9.03991 3.42532 8.53085 3.42532 7.99987C3.42532 7.46889 3.5199 6.95983 3.6799 6.47983L1.01803 4.41455Z" fill="#FBBC05" />
      <path d="M8.15982 3.18545C9.33802 3.18545 10.3853 3.59271 11.2216 4.37818L13.5125 2.0873C12.1234 0.792777 10.3199 0 8.15982 0C5.03257 0 2.33443 1.79636 1.01807 4.41455L3.67985 6.48001C4.31254 4.58908 6.07983 3.18545 8.15982 3.18545Z" fill="#EA4335" />
    </svg>
  );
}

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#3C1E1E"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.67 6.75l-.95 3.53c-.08.29.25.52.5.35l4.18-2.74c.53.07 1.07.11 1.6.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
      />
    </svg>
  );
}
import { useRouter, useSearchParams } from "next/navigation";
import type { UsersListResponse, UserRole } from "@/lib/types/admin";
import { DeleteUserDialog } from "./delete-user-dialog";
import { useState } from "react";

interface Props {
  data: UsersListResponse;
  canDelete: boolean;
}

const roleLabels: Record<UserRole, string> = {
  user: "일반 사용자",
  admin: "관리자",
  super_admin: "최고 관리자",
};

const roleBadgeVariants: Record<
  UserRole,
  "default" | "secondary" | "destructive"
> = {
  user: "secondary",
  admin: "default",
  super_admin: "destructive",
};

export function UsersTable({ data, canDelete }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = data.page;
  const totalPages = Math.ceil(data.total / data.perPage);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserEmail, setDeleteUserEmail] = useState<string>("");

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleDeleteClick = (userId: string, email: string) => {
    setDeleteUserId(userId);
    setDeleteUserEmail(email);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>마지막 로그인</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  등록된 회원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              data.users.map((user) => {
                const role = (user.user_metadata?.role as UserRole) || "user";
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.email || "-"}
                        <div className="flex items-center gap-1">
                          {user.app_metadata?.providers?.includes("email") && (
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          )}
                          {user.app_metadata?.providers?.includes("google") && (
                            <GoogleIcon className="h-4 w-4" />
                          )}
                          {user.app_metadata?.providers?.includes("kakao") && (
                            <div className="flex items-center justify-center h-4 w-4 bg-[#FEE500] rounded-sm">
                              <KakaoIcon className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariants[role]}>
                        {roleLabels[role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString(
                            "ko-KR"
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.email_confirmed_at ? "default" : "outline"
                        }
                      >
                        {user.email_confirmed_at ? "인증됨" : "미인증"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              상세 보기
                            </Link>
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                handleDeleteClick(user.id, user.email || "")
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          전체 {data.total}명 중 {(currentPage - 1) * data.perPage + 1}-
          {Math.min(currentPage * data.perPage, data.total)}명
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            이전
          </Button>
          <span className="flex items-center px-2 text-sm">
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            다음
          </Button>
        </div>
      </div>

      <DeleteUserDialog
        userId={deleteUserId}
        userEmail={deleteUserEmail}
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      />
    </div>
  );
}
