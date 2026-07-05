"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  updateSiteName,
  updateAnnouncementSettings,
  type AnnouncementSettings,
} from "@/app/admin/settings/actions";

interface Props {
  initialSiteName: string;
  initialAnnouncement: AnnouncementSettings;
}

export function SiteSettingsForm({ initialSiteName, initialAnnouncement }: Props) {
  const router = useRouter();
  const [siteName, setSiteName] = useState(initialSiteName);
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    initialAnnouncement.enabled
  );
  const [announcementText, setAnnouncementText] = useState(
    initialAnnouncement.text
  );
  const [announcementLink, setAnnouncementLink] = useState(
    initialAnnouncement.link
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingAnnouncement, setIsUpdatingAnnouncement] = useState(false);
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

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAnnouncement(true);
    setError(null);
    setSuccess(null);

    try {
      await updateAnnouncementSettings({
        enabled: announcementEnabled,
        text: announcementText,
        link: announcementLink,
      });
      setSuccess("공지 배너 설정이 저장되었습니다.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setIsUpdatingAnnouncement(false);
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

      <Card>
        <CardHeader>
          <CardTitle>공지 배너</CardTitle>
          <CardDescription>
            사이트 상단에 표시되는 공지 배너를 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={announcementEnabled}
                onCheckedChange={(checked) =>
                  setAnnouncementEnabled(checked === true)
                }
              />
              <span className="text-sm font-medium">배너 표시</span>
            </label>

            <div className="space-y-2">
              <Label htmlFor="announcementText">공지 문구</Label>
              <Input
                id="announcementText"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="예: 신규 가입 이벤트 진행 중!"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcementLink">링크 (선택)</Label>
              <Input
                id="announcementLink"
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="/products 또는 https://..."
              />
              <p className="text-sm text-muted-foreground">
                내부 경로(/...) 또는 https:// URL만 가능합니다.
              </p>
            </div>

            <Button type="submit" disabled={isUpdatingAnnouncement}>
              {isUpdatingAnnouncement ? "저장 중..." : "저장"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
