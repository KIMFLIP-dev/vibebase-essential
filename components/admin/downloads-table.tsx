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
  Github,
  FileArchive,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import type { DownloadItem } from "@/lib/types/download";
import { toggleDownloadPublished, deleteDownload } from "@/app/admin/downloads/actions";

interface Props {
  items: DownloadItem[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export function DownloadsTable({ items }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleTogglePublished = async (id: string) => {
    setIsToggling(id);
    try {
      await toggleDownloadPublished(id);
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
      await deleteDownload(deleteId);
      toast.success("다운로드 카드가 삭제되었습니다.");
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
        등록된 다운로드 카드가 없습니다. 새 카드를 만들어보세요.
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
              <TableHead>배지</TableHead>
              <TableHead className="text-center">GitHub</TableHead>
              <TableHead className="text-center">파일</TableHead>
              <TableHead className="text-center">YouTube</TableHead>
              <TableHead className="text-center">유료</TableHead>
              <TableHead className="text-right">가격</TableHead>
              <TableHead className="text-right">다운로드</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">등록일</TableHead>
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
                  <Link href={`/admin/downloads/${item.id}`} className="hover:underline">
                    {item.title}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.badge_label}
                </TableCell>
                <TableCell className="text-center">
                  {item.github_url ? (
                    <Github className="h-4 w-4 inline text-foreground" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.file_path ? (
                    <FileArchive className="h-4 w-4 inline text-foreground" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.youtube_url ? (
                    <Youtube className="h-4 w-4 inline text-red-600" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.is_paid ? (
                    <Badge variant="default">유료</Badge>
                  ) : (
                    <Badge variant="secondary">무료</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.is_paid ? `₩${Number(item.price).toLocaleString()}` : "-"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {(item.download_count ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={item.is_published ? "default" : "secondary"}>
                    {item.is_published ? "공개" : "비공개"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {formatDate(item.created_at)}
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
                        <Link href={`/admin/downloads/${item.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          편집
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleTogglePublished(item.id)}
                        disabled={isToggling === item.id}
                      >
                        {item.is_published ? (
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
            <AlertDialogTitle>다운로드 카드 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{deleteName}</strong> 카드를 삭제하시겠습니까?
              <br />
              업로드된 파일도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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
