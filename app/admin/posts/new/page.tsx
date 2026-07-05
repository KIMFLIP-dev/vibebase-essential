import { PostForm } from "@/components/admin/post-form";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewPostPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">새 글 작성</h2>
        <p className="text-muted-foreground">
          마크다운으로 본문을 작성하고 임시저장 또는 발행할 수 있습니다.
        </p>
      </div>

      <PostForm mode="create" />
    </div>
  );
}
