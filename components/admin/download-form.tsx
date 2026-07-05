"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDownload,
  updateDownload,
  uploadDownloadFile,
  deleteDownloadFile,
} from "@/app/admin/downloads/actions";
import type { DownloadItem, CardVariant } from "@/lib/types/download";
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from "@/lib/youtube";

interface Props {
  item?: DownloadItem;
  mode: "create" | "edit";
}

export function DownloadForm({ item, mode }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [badgeLabel, setBadgeLabel] = useState(item?.badge_label ?? "소스코드");
  const [githubUrl, setGithubUrl] = useState(item?.github_url ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(item?.youtube_url ?? "");
  const [isPaid, setIsPaid] = useState(item?.is_paid ?? false);
  const [price, setPrice] = useState(item?.price?.toString() ?? "0");
  const [cardVariant, setCardVariant] = useState<CardVariant>(item?.card_variant ?? "light");
  const [displayOrder, setDisplayOrder] = useState(item?.display_order?.toString() ?? "0");
  const [isPublished, setIsPublished] = useState(item?.is_published ?? true);

  const [filePath, setFilePath] = useState(item?.file_path ?? "");
  const [fileName, setFileName] = useState(item?.file_name ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const youtubeId = extractYoutubeVideoId(youtubeUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const input = {
        title,
        description: description || null,
        badge_label: badgeLabel || null,
        github_url: githubUrl || null,
        youtube_url: youtubeUrl || null,
        is_paid: isPaid,
        price: parseFloat(price) || 0,
        currency: "KRW",
        card_variant: cardVariant,
        display_order: parseInt(displayOrder) || 0,
        is_published: isPublished,
      };

      if (mode === "create") {
        const created = await createDownload(input);
        router.push(`/admin/downloads/${created.id}`);
        router.refresh();
      } else if (item) {
        await updateDownload(item.id, input);
        router.push("/admin/downloads");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>다운로드 카드의 기본 정보를 입력합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 바이브베이스 에센셜 무료소스"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="카드에 표시될 설명문"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="badgeLabel">배지 라벨</Label>
              <Input
                id="badgeLabel"
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="소스코드"
              />
              <p className="text-xs text-muted-foreground">
                카드 상단에 표시되는 작은 배지 텍스트
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">표시 순서</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                숫자가 작을수록 먼저 표시됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>액션</CardTitle>
          <CardDescription>
            GitHub URL과 파일 중 최소 하나는 등록해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
            />
          </div>

          <div className="space-y-2">
            <Label>다운로드 파일</Label>
            {mode === "create" ? (
              <p className="text-sm text-muted-foreground">
                카드 생성 후 편집 페이지에서 파일을 업로드할 수 있습니다.
              </p>
            ) : (
              <>
                {filePath ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate flex-1">
                      {fileName || filePath.split("/").pop()}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isUploading}
                      onClick={async () => {
                        if (!item) return;
                        setIsUploading(true);
                        setUploadError(null);
                        try {
                          await deleteDownloadFile(item.id);
                          setFilePath("");
                          setFileName("");
                        } catch (e) {
                          setUploadError(
                            e instanceof Error ? e.message : "삭제 실패"
                          );
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !item) return;
                      setIsUploading(true);
                      setUploadError(null);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const result = await uploadDownloadFile(item.id, fd);
                        setFilePath(result.file_path);
                        setFileName(result.file_name);
                      } catch (err) {
                        setUploadError(
                          err instanceof Error ? err.message : "업로드 실패"
                        );
                      } finally {
                        setIsUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                )}
                {isUploading && (
                  <p className="text-sm text-muted-foreground">업로드 중...</p>
                )}
                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  사용자 카드에 &quot;ZIP 다운로드&quot; 버튼이 표시됩니다.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>YouTube 연동</CardTitle>
          <CardDescription>
            연관된 YouTube 영상이 있으면 카드 우측 상단에 미니 썸네일 배지가 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube URL</Label>
            <Input
              id="youtubeUrl"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {youtubeUrl && !youtubeId && (
              <p className="text-sm text-destructive">
                YouTube URL 형식을 인식할 수 없습니다. 올바른 URL을 입력해주세요.
              </p>
            )}
            {youtubeId && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">미리보기:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getYoutubeThumbnailUrl(youtubeId)}
                  alt="YouTube 썸네일"
                  className="w-40 rounded-md border"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>가격 / 카드 옵션</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPaid"
              checked={isPaid}
              onCheckedChange={(checked) => {
                const next = checked === true;
                setIsPaid(next);
                if (next && cardVariant === "light") setCardVariant("dark");
                if (!next && cardVariant === "dark") setCardVariant("light");
              }}
            />
            <Label htmlFor="isPaid" className="font-normal">
              유료 다운로드 (Phase 2에서 결제 연동 예정 — 현재는 표시만)
            </Label>
          </div>

          {isPaid && (
            <div className="space-y-2">
              <Label htmlFor="price">가격 (KRW) *</Label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₩
                </span>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49000"
                  min="0"
                  required={isPaid}
                  className="pl-7"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cardVariant">카드 색상</Label>
            <Select
              value={cardVariant}
              onValueChange={(v) => setCardVariant(v as CardVariant)}
            >
              <SelectTrigger id="cardVariant" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light (흰 카드, 일반)</SelectItem>
                <SelectItem value="dark">Dark (검정 카드, 프리미엄)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              유료 카드는 자동으로 Dark가 권장됩니다.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <Label htmlFor="isPublished" className="font-normal">
              공개 (사용자 페이지에 표시)
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "저장 중..."
            : mode === "create"
              ? "카드 생성"
              : "변경사항 저장"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/downloads")}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
