"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createCourse,
  updateCourse,
  uploadSourceCode,
  deleteSourceCode,
} from "@/app/admin/courses/actions";
import type { Course } from "@/lib/types/course";

interface Props {
  course?: Course;
  mode: "create" | "edit";
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CourseForm({ course, mode }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(course?.title || "");
  const [slug, setSlug] = useState(course?.slug || "");
  const [description, setDescription] = useState(course?.description || "");
  const [shortDescription, setShortDescription] = useState(course?.short_description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url || "");
  const [price, setPrice] = useState(course?.price?.toString() || "0");
  const [originalPrice, setOriginalPrice] = useState(course?.original_price?.toString() || "");
  const [currency] = useState(course?.currency || "KRW");
  const [isPublished, setIsPublished] = useState(course?.is_published ?? false);
  const [isComingSoon, setIsComingSoon] = useState(course?.is_coming_soon ?? false);
  const [displayOrder, setDisplayOrder] = useState(course?.display_order?.toString() || "0");
  const [sourceCodePath, setSourceCodePath] = useState(course?.source_code_url || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(mode === "create");

  useEffect(() => {
    if (autoSlug && mode === "create") {
      setSlug(generateSlug(title));
    }
  }, [title, autoSlug, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const input = {
        title,
        slug,
        description: description || null,
        short_description: shortDescription || null,
        thumbnail_url: thumbnailUrl || null,
        price: parseFloat(price) || 0,
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        currency,
        is_published: isPublished,
        is_coming_soon: isComingSoon,
        display_order: parseInt(displayOrder) || 0,
      };

      if (mode === "create") {
        await createCourse(input);
      } else if (course) {
        await updateCourse(course.id, input);
      }

      router.push("/admin/courses");
      router.refresh();
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
          <CardDescription>코스의 기본 정보를 입력합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">코스 제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: Next.js 완전 정복"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAutoSlug(false);
                }}
                placeholder="nextjs-complete-guide"
                required
              />
              {mode === "create" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAutoSlug(true);
                    setSlug(generateSlug(title));
                  }}
                >
                  자동
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              URL에 사용됩니다: /courses/{slug || "..."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">짧은 설명</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="코스에 대한 한 줄 설명"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">상세 설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="코스에 대한 자세한 설명"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">썸네일 URL</Label>
            <Input
              id="thumbnailUrl"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
            />
            {thumbnailUrl && (
              <div className="mt-2">
                <img
                  src={thumbnailUrl}
                  alt="썸네일 미리보기"
                  className="max-w-xs rounded-md border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">정가 ({currency})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                <Input
                  id="originalPrice"
                  type="number"
                  step="1"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="89000"
                  min="0"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">비워두면 할인 표시 없음</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">판매가 ({currency}) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49000"
                  min="0"
                  required
                  className="pl-7"
                />
              </div>
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
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>옵션</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <Label htmlFor="isPublished" className="font-normal">
              공개 (사용자에게 표시)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isComingSoon"
              checked={isComingSoon}
              onCheckedChange={(checked) => setIsComingSoon(checked === true)}
            />
            <Label htmlFor="isComingSoon" className="font-normal">
              준비중 (가격·구매 버튼 숨김, 목차만 노출)
            </Label>
          </div>

          <div className="space-y-2">
            <Label>소스코드 파일</Label>
            {mode === "create" ? (
              <p className="text-sm text-muted-foreground">
                코스 생성 후 편집 페이지에서 소스코드 파일을 업로드할 수 있습니다.
              </p>
            ) : (
              <>
                {sourceCodePath ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate flex-1">
                      {sourceCodePath.split("/").pop()}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isUploading}
                      onClick={async () => {
                        if (!course) return;
                        setIsUploading(true);
                        setUploadError(null);
                        try {
                          await deleteSourceCode(course.id);
                          setSourceCodePath("");
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
                      if (!file || !course) return;
                      setIsUploading(true);
                      setUploadError(null);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const path = await uploadSourceCode(course.id, fd);
                        setSourceCodePath(path);
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
                  수강생에게 소스코드 다운로드 버튼이 표시됩니다. 비워두면 버튼이 표시되지 않습니다.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : mode === "create" ? "코스 생성" : "변경사항 저장"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/courses")}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
