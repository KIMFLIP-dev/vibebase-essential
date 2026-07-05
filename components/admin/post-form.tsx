"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import { useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createPost,
  updatePost,
  uploadPostImage,
} from "@/app/admin/posts/actions";
import type { Post, PostStatus } from "@/lib/types/post";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Props {
  item?: Post;
  mode: "create" | "edit";
}

export function PostForm({ item, mode }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(item?.cover_image_url ?? "");
  const [tags, setTags] = useState((item?.tags ?? []).join(", "));
  const [status, setStatus] = useState<PostStatus>(item?.status ?? "draft");
  const [content, setContent] = useState(item?.content_md ?? "");

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingBody, setIsUploadingBody] = useState(false);
  const bodyFileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const input = {
        title,
        slug: slug || undefined,
        excerpt: excerpt || null,
        content_md: content,
        cover_image_url: coverImageUrl || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status,
      };

      if (mode === "create") {
        const created = await createPost(input);
        toast.success("글이 생성되었습니다.");
        router.push(`/admin/posts/${created.id}`);
        router.refresh();
      } else if (item) {
        await updatePost(item.id, input);
        toast.success("변경사항이 저장되었습니다.");
        router.push("/admin/posts");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadPostImage(fd);
      setCoverImageUrl(url);
      toast.success("커버 이미지가 업로드되었습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleBodyImageUpload = async (file: File) => {
    setIsUploadingBody(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadPostImage(fd);
      // 본문 끝에 마크다운 이미지 삽입
      setContent((prev) => `${prev}${prev.endsWith("\n") || prev === "" ? "" : "\n\n"}![](${url})\n`);
      toast.success("본문에 이미지를 추가했습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setIsUploadingBody(false);
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
          <CardDescription>블로그 글의 기본 정보를 입력합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 바이브코딩으로 1인 SaaS 런칭하기"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">슬러그 (URL)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="비우면 제목에서 자동 생성"
            />
            <p className="text-xs text-muted-foreground">
              미리보기: /blog/{slug ? slug : "<자동 생성>"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">발췌 (요약)</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="목록과 검색결과(OG)에 노출되는 짧은 요약"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">태그</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="쉼표로 구분 (예: 바이브코딩, SaaS, Next.js)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>커버 이미지</CardTitle>
          <CardDescription>목록 카드와 상세 헤더에 표시됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {coverImageUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt="커버 미리보기"
                className="w-full max-w-md rounded-md border object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setCoverImageUrl("")}
              >
                커버 제거
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept="image/*"
              disabled={isUploadingCover}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverUpload(file);
                e.target.value = "";
              }}
            />
          )}
          {isUploadingCover && (
            <p className="text-sm text-muted-foreground">업로드 중...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>본문 (마크다운)</CardTitle>
          <CardDescription>
            마크다운으로 작성하면 오른쪽에 실시간 미리보기가 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              ref={bodyFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBodyImageUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingBody}
              onClick={() => bodyFileRef.current?.click()}
            >
              {isUploadingBody ? "업로드 중..." : "본문에 이미지 추가"}
            </Button>
            <span className="text-xs text-muted-foreground">
              업로드하면 본문 끝에 마크다운 이미지가 삽입됩니다.
            </span>
          </div>

          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(v) => setContent(v ?? "")}
              height={500}
              textareaProps={{ placeholder: "여기에 마크다운으로 본문을 작성하세요..." }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>발행 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
              <SelectTrigger id="status" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">임시저장 (비공개)</SelectItem>
                <SelectItem value="published">발행 (공개)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              발행으로 처음 전환되는 시점이 발행일로 기록됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "저장 중..."
            : mode === "create"
              ? "글 생성"
              : "변경사항 저장"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/posts")}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
