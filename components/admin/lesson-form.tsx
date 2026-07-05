"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import type { Lesson } from "@/lib/types/course";
import {
  createLesson,
  updateLesson,
  fetchVimeoMetadata,
} from "@/app/admin/courses/actions";
import { formatDuration } from "@/lib/vimeo/client";

interface Props {
  chapterId: string;
  lesson?: Lesson;
  mode: "create" | "edit";
  onClose: () => void;
  onSuccess: () => void;
}

export function LessonForm({ chapterId, lesson, mode, onClose, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingVimeo, setIsFetchingVimeo] = useState(false);

  const [title, setTitle] = useState(lesson?.title || "");
  const [description, setDescription] = useState(lesson?.description || "");
  const [vimeoVideoId, setVimeoVideoId] = useState(lesson?.vimeo_video_id || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(lesson?.thumbnail_url || "");
  const [durationSeconds, setDurationSeconds] = useState(lesson?.duration_seconds || 0);
  const [isFree, setIsFree] = useState(lesson?.is_free ?? false);
  const [isComingSoon, setIsComingSoon] = useState(lesson?.is_coming_soon ?? false);

  const handleFetchVimeo = async () => {
    if (!vimeoVideoId.trim()) {
      toast.error("Vimeo Video ID를 입력해주세요.");
      return;
    }

    setIsFetchingVimeo(true);
    try {
      const metadata = await fetchVimeoMetadata(vimeoVideoId.trim());
      setThumbnailUrl(metadata.thumbnail_url || "");
      setDurationSeconds(metadata.duration_seconds || 0);
      if (!title) {
        setTitle(metadata.title);
      }
      toast.success("Vimeo 정보를 가져왔습니다.");
    } catch (error) {
      toast.error("Vimeo 정보 가져오기 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsFetchingVimeo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        title,
        description: description || null,
        vimeo_video_id: vimeoVideoId || null,
        thumbnail_url: thumbnailUrl || null,
        duration_seconds: durationSeconds,
        is_free: isFree,
        is_coming_soon: isComingSoon,
      };

      if (mode === "create") {
        await createLesson(chapterId, data);
        toast.success("레슨이 추가되었습니다.");
      } else if (lesson) {
        await updateLesson(lesson.id, data);
        toast.success("레슨이 수정되었습니다.");
      }

      onSuccess();
    } catch (error) {
      toast.error("저장 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`lesson-title-${lesson?.id || "new"}`}>레슨 제목 *</Label>
        <Input
          id={`lesson-title-${lesson?.id || "new"}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="레슨 제목"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`lesson-desc-${lesson?.id || "new"}`}>설명</Label>
        <Textarea
          id={`lesson-desc-${lesson?.id || "new"}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="레슨에 대한 설명"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`lesson-vimeo-${lesson?.id || "new"}`}>Vimeo Video ID</Label>
        <div className="flex gap-2">
          <Input
            id={`lesson-vimeo-${lesson?.id || "new"}`}
            value={vimeoVideoId}
            onChange={(e) => setVimeoVideoId(e.target.value)}
            placeholder="예: 123456789"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchVimeo}
            disabled={isFetchingVimeo || !vimeoVideoId.trim()}
          >
            {isFetchingVimeo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-1">정보 가져오기</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`lesson-thumb-${lesson?.id || "new"}`}>썸네일 URL</Label>
          <Input
            id={`lesson-thumb-${lesson?.id || "new"}`}
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`lesson-duration-${lesson?.id || "new"}`}>영상 길이 (초)</Label>
          <div className="flex items-center gap-2">
            <Input
              id={`lesson-duration-${lesson?.id || "new"}`}
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
              min="0"
              className="w-24"
            />
            {durationSeconds > 0 && (
              <span className="text-sm text-muted-foreground">
                ({formatDuration(durationSeconds)})
              </span>
            )}
          </div>
        </div>
      </div>

      {thumbnailUrl && (
        <div>
          <img
            src={thumbnailUrl}
            alt="썸네일 미리보기"
            className="max-w-[200px] rounded-md border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id={`lesson-free-${lesson?.id || "new"}`}
          checked={isFree}
          onCheckedChange={(checked) => setIsFree(checked === true)}
        />
        <Label htmlFor={`lesson-free-${lesson?.id || "new"}`} className="font-normal">
          무료 공개 레슨
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id={`lesson-coming-soon-${lesson?.id || "new"}`}
          checked={isComingSoon}
          onCheckedChange={(checked) => setIsComingSoon(checked === true)}
        />
        <Label htmlFor={`lesson-coming-soon-${lesson?.id || "new"}`} className="font-normal">
          공개예정 레슨
        </Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting
            ? "저장 중..."
            : mode === "create"
              ? "레슨 추가"
              : "레슨 수정"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          취소
        </Button>
      </div>
    </form>
  );
}
