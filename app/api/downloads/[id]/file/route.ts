import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const DOWNLOAD_BUCKET = "download-files";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { data: item, error: itemError } = await supabase
    .from("download_items")
    .select("id, file_path, is_paid, is_published")
    .eq("id", id)
    .single();

  if (itemError || !item) {
    return NextResponse.json(
      { error: "다운로드 항목을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!item.is_published) {
    return NextResponse.json(
      { error: "비공개 다운로드입니다." },
      { status: 404 }
    );
  }

  if (!item.file_path) {
    return NextResponse.json(
      { error: "파일이 등록되지 않았습니다." },
      { status: 404 }
    );
  }

  // Phase 1: 유료 다운로드는 결제 연동 전이므로 차단
  // Phase 2에서 download_purchases 조회 + 구매 확인 로직으로 교체
  if (item.is_paid) {
    return NextResponse.json(
      { error: "유료 다운로드는 곧 출시 예정입니다." },
      { status: 503 }
    );
  }

  const adminClient = createAdminClient();
  const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
    .from(DOWNLOAD_BUCKET)
    .createSignedUrl(item.file_path, 300);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { error: "다운로드 URL 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  // 다운로드 카운트 증가 (실패해도 다운로드는 진행)
  const { error: countError } = await adminClient.rpc("increment_download_count", {
    p_id: id,
  });
  if (countError) {
    console.warn("[downloads] count increment failed:", countError.message);
  }

  return NextResponse.redirect(signedUrlData.signedUrl);
}
