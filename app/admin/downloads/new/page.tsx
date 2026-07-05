import { DownloadForm } from "@/components/admin/download-form";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewDownloadPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">새 다운로드 추가</h2>
        <p className="text-muted-foreground">
          새로운 다운로드 카드를 생성합니다. 파일 업로드는 생성 후 편집 페이지에서 가능합니다.
        </p>
      </div>

      <DownloadForm mode="create" />
    </div>
  );
}
