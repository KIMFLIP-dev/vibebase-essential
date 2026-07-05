"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateUser, updateUserRole, deleteUser } from "@/app/admin/users/actions";
import { DeleteUserDialog } from "./delete-user-dialog";
import type { AdminUser, UserRole } from "@/lib/types/admin";

interface Props {
  user: AdminUser;
  canChangeRole: boolean;
}

const roleLabels: Record<UserRole, string> = {
  user: "일반 사용자",
  admin: "관리자",
  super_admin: "최고 관리자",
};

export function UserDetailForm({ user, canChangeRole }: Props) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [fullName, setFullName] = useState(
    (user.user_metadata?.full_name as string) || ""
  );
  const currentRole = (user.user_metadata?.role as UserRole) || "user";

  const handleUpdateInfo = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUser(user.id, {
        user_metadata: {
          ...user.user_metadata,
          full_name: fullName,
        },
      });
      setSuccess("회원 정보가 수정되었습니다.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserRole(user.id, newRole);
      setSuccess("역할이 변경되었습니다.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "역할 변경 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={user.email || "-"} disabled />
            </div>
            <div className="space-y-2">
              <Label>전화번호</Label>
              <Input value={user.phone || "-"} disabled />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>가입일</Label>
              <Input
                value={new Date(user.created_at).toLocaleString("ko-KR")}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>마지막 로그인</Label>
              <Input
                value={
                  user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString("ko-KR")
                    : "-"
                }
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>이메일 인증 상태</Label>
            <div>
              <Badge variant={user.email_confirmed_at ? "default" : "outline"}>
                {user.email_confirmed_at ? "인증됨" : "미인증"}
              </Badge>
              {user.email_confirmed_at && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({new Date(user.email_confirmed_at).toLocaleString("ko-KR")})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>가입 방법</Label>
            <div className="flex gap-2">
              {user.app_metadata?.providers?.map((provider) => (
                <Badge key={provider} variant="secondary">
                  {provider}
                </Badge>
              )) || <Badge variant="secondary">email</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">이름</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>

          <Button onClick={handleUpdateInfo} disabled={isUpdating}>
            {isUpdating ? "저장 중..." : "저장"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>역할 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>현재 역할</Label>
            <div className="flex items-center gap-4">
              {canChangeRole ? (
                <Select
                  value={currentRole}
                  onValueChange={(value) => handleRoleChange(value as UserRole)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{roleLabels.user}</SelectItem>
                    <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                    <SelectItem value="super_admin">
                      {roleLabels.super_admin}
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant={
                    currentRole === "super_admin" ? "destructive" : "default"
                  }
                >
                  {roleLabels[currentRole]}
                </Badge>
              )}
            </div>
            {!canChangeRole && (
              <p className="text-sm text-muted-foreground">
                역할 변경은 최고 관리자만 가능합니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {canChangeRole && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">위험 구역</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              회원을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은
              되돌릴 수 없습니다.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              회원 삭제
            </Button>
          </CardContent>
        </Card>
      )}

      <DeleteUserDialog
        userId={user.id}
        userEmail={user.email || ""}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}
