"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteName } from "@/app/admin/settings/actions";

interface Props {
  initialSiteName: string;
}

export function SiteSettingsForm({ initialSiteName }: Props) {
  const router = useRouter();
  const [siteName, setSiteName] = useState(initialSiteName);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateSiteName(siteName);
      setSuccess("웹사이트 설정이 저장되었습니다.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
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
          <CardTitle>기본 설정</CardTitle>
          <CardDescription>
            웹사이트의 기본 정보를 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">웹사이트명</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="웹사이트 이름을 입력하세요"
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground">
                이 이름은 사이트 전반에 걸쳐 표시됩니다.
              </p>
            </div>

            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "저장 중..." : "저장"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
