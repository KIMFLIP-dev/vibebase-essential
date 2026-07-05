"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import type { ChapterWithLessons } from "@/lib/types/course";
import { LessonForm } from "@/components/admin/lesson-form";
import { formatDuration } from "@/lib/vimeo/client";
import {
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  deleteLesson,
  reorderLessons,
} from "@/app/admin/courses/actions";

interface Props {
  courseId: string;
  chapters: ChapterWithLessons[];
}

export function CourseChaptersEditor({ courseId, chapters }: Props) {
  const router = useRouter();
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [addingLessonChapterId, setAddingLessonChapterId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // 삭제 다이얼로그
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [deleteChapterName, setDeleteChapterName] = useState("");
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);
  const [deleteLessonName, setDeleteLessonName] = useState("");
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

  const toggleChapter = (id: string) => {
    const newOpen = new Set(openChapters);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenChapters(newOpen);
  };

  // 챕터 추가
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    setIsAddingChapter(true);
    try {
      await createChapter(courseId, newChapterTitle.trim());
      setNewChapterTitle("");
      toast.success("챕터가 추가되었습니다.");
      router.refresh();
    } catch (error) {
      toast.error("챕터 추가 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsAddingChapter(false);
    }
  };

  // 챕터 수정
  const handleUpdateChapter = async (id: string) => {
    if (!editChapterTitle.trim()) return;
    try {
      await updateChapter(id, editChapterTitle.trim());
      setEditingChapterId(null);
      toast.success("챕터가 수정되었습니다.");
      router.refresh();
    } catch (error) {
      toast.error("챕터 수정 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  };

  // 챕터 삭제
  const handleDeleteChapter = async () => {
    if (!deleteChapterId) return;
    setIsDeletingChapter(true);
    try {
      await deleteChapter(deleteChapterId);
      setDeleteChapterId(null);
      toast.success("챕터가 삭제되었습니다.");
      router.refresh();
    } catch (error) {
      toast.error("챕터 삭제 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsDeletingChapter(false);
    }
  };

  // 챕터 순서 변경
  const handleMoveChapter = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= chapters.length) return;

    const orderedIds = chapters.map((c) => c.id);
    [orderedIds[index], orderedIds[newIndex]] = [orderedIds[newIndex], orderedIds[index]];

    try {
      await reorderChapters(courseId, orderedIds);
      router.refresh();
    } catch (error) {
      toast.error("순서 변경 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  };

  // 레슨 삭제
  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;
    setIsDeletingLesson(true);
    try {
      await deleteLesson(deleteLessonId);
      setDeleteLessonId(null);
      toast.success("레슨이 삭제되었습니다.");
      router.refresh();
    } catch (error) {
      toast.error("레슨 삭제 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsDeletingLesson(false);
    }
  };

  // 레슨 순서 변경
  const handleMoveLesson = async (
    chapterId: string,
    lessons: { id: string }[],
    index: number,
    direction: "up" | "down"
  ) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;

    const orderedIds = lessons.map((l) => l.id);
    [orderedIds[index], orderedIds[newIndex]] = [orderedIds[newIndex], orderedIds[index]];

    try {
      await reorderLessons(chapterId, orderedIds);
      router.refresh();
    } catch (error) {
      toast.error("순서 변경 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 챕터 목록 */}
      {chapters.map((chapter, chapterIndex) => (
        <Card key={chapter.id}>
          <Collapsible
            open={openChapters.has(chapter.id)}
            onOpenChange={() => toggleChapter(chapter.id)}
          >
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {editingChapterId === chapter.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editChapterTitle}
                        onChange={(e) => setEditChapterTitle(e.target.value)}
                        className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateChapter(chapter.id);
                          if (e.key === "Escape") setEditingChapterId(null);
                        }}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateChapter(chapter.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingChapterId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors">
                          {openChapters.has(chapter.id) ? (
                            <ChevronUp className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className="font-medium truncate">
                            {chapterIndex + 1}. {chapter.title}
                          </span>
                        </button>
                      </CollapsibleTrigger>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {chapter.lessons.length}개 레슨
                      </Badge>
                    </>
                  )}
                </div>

                {editingChapterId !== chapter.id && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMoveChapter(chapterIndex, "up")}
                      disabled={chapterIndex === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMoveChapter(chapterIndex, "down")}
                      disabled={chapterIndex === chapters.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingChapterId(chapter.id);
                        setEditChapterTitle(chapter.title);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        setDeleteChapterId(chapter.id);
                        setDeleteChapterName(chapter.title);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {/* 레슨 목록 */}
                {chapter.lessons.length > 0 ? (
                  <div className="space-y-2">
                    {chapter.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-md border bg-muted/30"
                      >
                        <span className="text-sm text-muted-foreground w-6 text-right flex-shrink-0">
                          {lessonIndex + 1}.
                        </span>

                        {editingLessonId === lesson.id ? (
                          <div className="flex-1">
                            <LessonForm
                              chapterId={chapter.id}
                              lesson={lesson}
                              mode="edit"
                              onClose={() => setEditingLessonId(null)}
                              onSuccess={() => {
                                setEditingLessonId(null);
                                router.refresh();
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">
                                  {lesson.title}
                                </span>
                                {lesson.is_free && (
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    무료
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                {lesson.duration_seconds > 0 && (
                                  <span>{formatDuration(lesson.duration_seconds)}</span>
                                )}
                                {lesson.vimeo_video_id && (
                                  <span>Vimeo: {lesson.vimeo_video_id}</span>
                                )}
                              </div>
                            </div>

                            {lesson.thumbnail_url && (
                              <img
                                src={lesson.thumbnail_url}
                                alt=""
                                className="w-16 h-10 object-cover rounded flex-shrink-0"
                              />
                            )}

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  handleMoveLesson(chapter.id, chapter.lessons, lessonIndex, "up")
                                }
                                disabled={lessonIndex === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  handleMoveLesson(
                                    chapter.id,
                                    chapter.lessons,
                                    lessonIndex,
                                    "down"
                                  )
                                }
                                disabled={lessonIndex === chapter.lessons.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditingLessonId(lesson.id)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => {
                                  setDeleteLessonId(lesson.id);
                                  setDeleteLessonName(lesson.title);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    아직 레슨이 없습니다. 레슨을 추가해보세요.
                  </p>
                )}

                {/* 레슨 추가 폼 */}
                {addingLessonChapterId === chapter.id ? (
                  <div className="border rounded-md p-4 bg-background">
                    <LessonForm
                      chapterId={chapter.id}
                      mode="create"
                      onClose={() => setAddingLessonChapterId(null)}
                      onSuccess={() => {
                        setAddingLessonChapterId(null);
                        router.refresh();
                      }}
                    />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAddingLessonChapterId(chapter.id);
                      // 자동으로 챕터 펼치기
                      if (!openChapters.has(chapter.id)) {
                        toggleChapter(chapter.id);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    레슨 추가
                  </Button>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      {/* 챕터 추가 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="새 챕터 제목"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddChapter();
              }}
            />
            <Button
              onClick={handleAddChapter}
              disabled={isAddingChapter || !newChapterTitle.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              {isAddingChapter ? "추가 중..." : "챕터 추가"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 챕터 삭제 다이얼로그 */}
      <AlertDialog
        open={!!deleteChapterId}
        onOpenChange={(open) => !open && setDeleteChapterId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>챕터 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{deleteChapterName}</strong> 챕터를 삭제하시겠습니까?
              <br />
              챕터에 포함된 모든 레슨도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingChapter}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChapter}
              disabled={isDeletingChapter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingChapter ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 레슨 삭제 다이얼로그 */}
      <AlertDialog
        open={!!deleteLessonId}
        onOpenChange={(open) => !open && setDeleteLessonId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>레슨 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{deleteLessonName}</strong> 레슨을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLesson}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              disabled={isDeletingLesson}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingLesson ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
