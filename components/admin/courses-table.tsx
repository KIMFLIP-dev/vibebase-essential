"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import type { Course } from "@/lib/types/course";
import { formatTotalDuration } from "@/lib/vimeo/client";
import {
  toggleCoursePublished,
  deleteCourse,
} from "@/app/admin/courses/actions";

interface Props {
  courses: Course[];
}

export function CoursesTable({ courses }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleTogglePublished = async (id: string) => {
    setIsToggling(id);
    try {
      await toggleCoursePublished(id);
      router.refresh();
    } catch (error) {
      toast.error("상태 변경 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsToggling(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteCourse(deleteId);
      toast.success("코스가 삭제되었습니다.");
      setDeleteId(null);
      router.refresh();
    } catch (error) {
      toast.error("삭제 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 코스가 없습니다. 새 코스를 만들어보세요.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>slug</TableHead>
              <TableHead className="text-right">가격</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">레슨</TableHead>
              <TableHead className="text-center">총 시간</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="hover:underline"
                  >
                    {course.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {course.slug}
                </TableCell>
                <TableCell className="text-right">
                  {course.original_price && course.original_price > course.price ? (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground line-through">₩{course.original_price.toLocaleString()}</span>
                      <span>₩{course.price.toLocaleString()}</span>
                    </div>
                  ) : (
                    <>₩{course.price.toLocaleString()}</>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "공개" : "비공개"}
                    </Badge>
                    {course.is_coming_soon && (
                      <Badge variant="outline">준비중</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {course.lesson_count || 0}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {formatTotalDuration(course.total_duration || 0)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/courses/${course.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          편집
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleTogglePublished(course.id)}
                        disabled={isToggling === course.id}
                      >
                        {course.is_published ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            비공개로 전환
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            공개로 전환
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeleteId(course.id);
                          setDeleteName(course.title);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>코스 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{deleteName}</strong> 코스를 삭제하시겠습니까?
              <br />
              모든 챕터와 레슨도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
