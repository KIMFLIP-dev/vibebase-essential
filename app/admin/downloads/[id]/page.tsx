import { notFound } from "next/navigation";
import { DownloadForm } from "@/components/admin/download-form";
import { getAdminDownload } from "../actions";
import { requireAdmin } from "@/lib/admin/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDownloadPage({ params }: Props) {
  await requireAdmin();

  const { id } = await params;
  const item = await getAdminDownload(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">다운로드 수정</h2>
        <p className="text-muted-foreground">
          {item.title} 카드의 정보를 수정합니다.
        </p>
      </div>

      <DownloadForm item={item} mode="edit" />
    </div>
  );
}
