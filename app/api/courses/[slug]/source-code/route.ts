import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = await createClient();

  // 유저 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // 코스 조회
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, source_code_url")
    .eq("slug", slug)
    .single();

  if (courseError || !course) {
    return NextResponse.json(
      { error: "코스를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!course.source_code_url) {
    return NextResponse.json(
      { error: "소스코드가 등록되지 않았습니다." },
      { status: 404 }
    );
  }

  // 구매 확인
  const { data: purchase } = await supabase
    .from("course_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("status", "completed")
    .limit(1)
    .single();

  if (!purchase) {
    return NextResponse.json(
      { error: "구매한 코스만 소스코드를 다운로드할 수 있습니다." },
      { status: 403 }
    );
  }

  // Signed URL 생성 (5분 만료)
  const adminClient = createAdminClient();
  const { data: signedUrlData, error: signedUrlError } = await adminClient
    .storage
    .from("source-codes")
    .createSignedUrl(course.source_code_url, 300);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { error: "다운로드 URL 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signedUrlData.signedUrl);
}
