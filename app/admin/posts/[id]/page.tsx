import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getAdminPost } from "../actions";
import { requireAdmin } from "@/lib/admin/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  await requireAdmin();

  const { id } = await params;
  const item = await getAdminPost(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">글 수정</h2>
        <p className="text-muted-foreground">{item.title} 글을 수정합니다.</p>
      </div>

      <PostForm item={item} mode="edit" />
    </div>
  );
}
