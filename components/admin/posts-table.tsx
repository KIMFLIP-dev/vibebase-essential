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
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types/post";
import { togglePostStatus, deletePost } from "@/app/admin/posts/actions";

interface Props {
  items: Post[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export function PostsTable({ items }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleToggleStatus = async (id: string) => {
    setIsToggling(id);
    try {
      await togglePostStatus(id);
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
      await deletePost(deleteId);
      toast.success("글이 삭제되었습니다.");
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

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 글이 없습니다. 새 글을 작성해보세요.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">순서</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>슬러그</TableHead>
              <TableHead>태그</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-right">조회수</TableHead>
              <TableHead className="text-center">발행일</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-center text-muted-foreground">
                  {item.display_order}
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/admin/posts/${item.id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">
                  {item.slug}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.tags && item.tags.length > 0 ? item.tags.join(", ") : "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={item.status === "published" ? "default" : "secondary"}>
                    {item.status === "published" ? "발행" : "임시저장"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {(item.view_count ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {formatDate(item.published_at)}
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
                        <Link href={`/admin/posts/${item.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          편집
                        </Link>
                      </DropdownMenuItem>
                      {item.status === "published" && (
                        <DropdownMenuItem asChild>
                          <Link href={`/blog/${item.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            글 보기
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(item.id)}
                        disabled={isToggling === item.id}
                      >
                        {item.status === "published" ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            임시저장으로 전환
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            발행하기
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeleteId(item.id);
                          setDeleteName(item.title);
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
            <AlertDialogTitle>글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{deleteName}</strong> 글을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
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
