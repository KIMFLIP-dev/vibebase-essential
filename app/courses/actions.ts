"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPayment } from "@/lib/portone/client";
import { PortOneApiError } from "@/lib/portone/client";
import type {
  Course,
  CourseWithChapters,
  ChapterWithLessons,
  Lesson,
  CoursePurchase,
} from "@/lib/types/course";

// 공개 코스 목록 조회 (레슨 수 + 총 시간 집계)
export async function getPublishedCourses(): Promise<Course[]> {
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      `
      *,
      chapters(
        id,
        display_order,
        lessons(id, title, is_free, is_coming_soon, duration_seconds, display_order)
      )
    `
    )
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("코스 목록 조회 오류:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (courses || []).map((course: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chapters = ((course.chapters as any[]) || []).sort((a: any, b: any) => a.display_order - b.display_order);
    let lessonCount = 0;
    let totalDuration = 0;
    const lessonPreviews: { title: string; is_free: boolean }[] = [];

    for (const chapter of chapters) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lessons = ((chapter.lessons || []) as any[]).sort((a: any, b: any) => a.display_order - b.display_order);
      lessonCount += lessons.length;
      for (const lesson of lessons) {
        totalDuration += lesson.duration_seconds || 0;
        lessonPreviews.push({ title: lesson.title, is_free: lesson.is_free });
      }
    }

    delete course.chapters;
    return {
      ...course,
      lesson_count: lessonCount,
      total_duration: totalDuration,
      lesson_previews: lessonPreviews,
    } as Course;
  });
}

// 코스 상세 조회 (slug 기반) + 챕터 + 레슨 (display_order 정렬)
export async function getCourseBySlug(
  slug: string
): Promise<CourseWithChapters | null> {
  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select(
      `
      *,
      chapters(
        *,
        lessons(*)
      )
    `
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !course) {
    return null;
  }

  // 챕터와 레슨을 display_order로 정렬
  const chapters = ((course.chapters as ChapterWithLessons[]) || [])
    .sort((a, b) => a.display_order - b.display_order)
    .map((chapter) => ({
      ...chapter,
      lessons: (chapter.lessons || []).sort(
        (a, b) => a.display_order - b.display_order
      ),
    }));

  // 레슨 수/총 시간 집계
  let lessonCount = 0;
  let totalDuration = 0;
  for (const chapter of chapters) {
    lessonCount += chapter.lessons.length;
    for (const lesson of chapter.lessons) {
      totalDuration += lesson.duration_seconds || 0;
    }
  }

  return {
    ...course,
    chapters,
    lesson_count: lessonCount,
    total_duration: totalDuration,
  } as CourseWithChapters;
}

// 현재 유저 구매 여부 확인
export async function hasUserPurchasedCourse(
  courseId: string
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("course_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "completed")
    .limit(1)
    .single();

  return !!data;
}

// 레슨 상세 + 접근 권한 체크
export async function getLessonWithAccess(lessonId: string): Promise<{
  lesson: Lesson | null;
  course: CourseWithChapters | null;
  hasAccess: boolean;
}> {
  const supabase = await createClient();

  // 레슨 조회
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    return { lesson: null, course: null, hasAccess: false };
  }

  // 챕터 → 코스 조회
  const { data: chapter } = await supabase
    .from("chapters")
    .select("course_id")
    .eq("id", lesson.chapter_id)
    .single();

  if (!chapter) {
    return { lesson: null, course: null, hasAccess: false };
  }

  // 코스 + 전체 챕터/레슨 조회
  const { data: course } = await supabase
    .from("courses")
    .select(
      `
      *,
      chapters(
        *,
        lessons(*)
      )
    `
    )
    .eq("id", chapter.course_id)
    .eq("is_published", true)
    .single();

  if (!course) {
    return { lesson: lesson as Lesson, course: null, hasAccess: false };
  }

  // 챕터/레슨 정렬
  const chapters = ((course.chapters as ChapterWithLessons[]) || [])
    .sort((a, b) => a.display_order - b.display_order)
    .map((ch) => ({
      ...ch,
      lessons: (ch.lessons || []).sort(
        (a, b) => a.display_order - b.display_order
      ),
    }));

  let lessonCount = 0;
  let totalDuration = 0;
  for (const ch of chapters) {
    lessonCount += ch.lessons.length;
    for (const l of ch.lessons) {
      totalDuration += l.duration_seconds || 0;
    }
  }

  const courseWithChapters: CourseWithChapters = {
    ...course,
    chapters,
    lesson_count: lessonCount,
    total_duration: totalDuration,
  } as CourseWithChapters;

  // 접근 권한 확인: 무료 레슨이면 접근 가능
  if (lesson.is_free) {
    return {
      lesson: lesson as Lesson,
      course: courseWithChapters,
      hasAccess: true,
    };
  }

  // 유료 레슨: 구매 여부 확인
  const purchased = await hasUserPurchasedCourse(chapter.course_id);

  // 미구매시 vimeo_video_id 제거
  if (!purchased) {
    return {
      lesson: { ...(lesson as Lesson), vimeo_video_id: null },
      course: courseWithChapters,
      hasAccess: false,
    };
  }

  return {
    lesson: lesson as Lesson,
    course: courseWithChapters,
    hasAccess: true,
  };
}

// 결제 요청 전 pending_order 생성 (체크아웃 페이지에서 호출)
export async function createPendingOrder(
  courseId: string
): Promise<{ orderId: string; amount: number; orderName: string }> {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 코스 조회
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("is_published", true)
    .single();

  if (error || !course) {
    throw new Error("코스를 찾을 수 없습니다.");
  }

  if (course.is_coming_soon) {
    throw new Error("준비중인 코스는 아직 구매할 수 없습니다.");
  }

  if (course.price <= 0) {
    throw new Error("무료 코스는 결제가 필요하지 않습니다.");
  }

  // 이미 구매했는지 확인
  const { data: existing } = await supabase
    .from("course_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "completed")
    .limit(1)
    .single();

  if (existing) {
    throw new Error("이미 구매한 코스입니다.");
  }

  // orderId 생성: COURSE_{courseId 앞8자}_{timestamp}_{random}
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const orderId = `COURSE_${courseId.substring(0, 8)}_${timestamp}_${random}`;

  // pending_orders에 저장 (service_role 사용)
  const { error: insertError } = await adminClient.from("pending_orders").insert({
    user_id: user.id,
    course_id: courseId,
    order_id: orderId,
    amount: course.price,
    currency: course.currency || "KRW",
  });

  if (insertError) {
    console.error("주문 생성 오류:", insertError);
    throw new Error("주문 생성에 실패했습니다.");
  }

  return {
    orderId,
    amount: course.price,
    orderName: course.title,
  };
}

// 결제 검증 + 구매 저장 (PortOne V2: 위젯에서 호출)
export async function confirmAndSavePurchase(
  paymentId: string,
  orderId: string
): Promise<{
  success: boolean;
  courseSlug?: string;
  courseTitle?: string;
  error?: string;
}> {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 1. pending_orders에서 orderId로 조회
  const { data: pendingOrder, error: pendingError } = await adminClient
    .from("pending_orders")
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .single();

  if (pendingError || !pendingOrder) {
    return { success: false, error: "주문 정보를 찾을 수 없습니다." };
  }

  if (pendingOrder.status === "completed") {
    // 이미 처리된 주문 - 코스 정보만 반환
    const { data: course } = await supabase
      .from("courses")
      .select("slug, title")
      .eq("id", pendingOrder.course_id)
      .single();
    return {
      success: true,
      courseSlug: course?.slug,
      courseTitle: course?.title,
    };
  }

  // 2. 포트원 API로 결제 상태/금액 조회
  try {
    const payment = await getPayment(paymentId);

    // 결제 상태 확인
    if (payment.status !== "PAID") {
      return { success: false, error: `결제가 완료되지 않았습니다. (상태: ${payment.status})` };
    }

    // 금액 변조 확인
    if (payment.amount.total !== Number(pendingOrder.amount)) {
      return { success: false, error: "결제 금액이 일치하지 않습니다." };
    }

    // 3. course_purchases에 저장 (service_role 사용)
    const { error: insertError } = await adminClient.from("course_purchases").insert({
      user_id: user.id,
      course_id: pendingOrder.course_id,
      toss_order_id: orderId,
      toss_payment_key: paymentId,
      status: "completed",
      amount: payment.amount.total,
      currency: payment.currency || "KRW",
      payment_method: payment.method?.type || null,
    });

    if (insertError) {
      console.error("코스 구매 저장 오류:", insertError);
      return { success: false, error: "구매 정보 저장에 실패했습니다." };
    }

    // 4. pending_orders 상태를 completed로 업데이트
    await adminClient
      .from("pending_orders")
      .update({ status: "completed" })
      .eq("order_id", orderId);

    // 코스 정보 조회
    const { data: course } = await supabase
      .from("courses")
      .select("slug, title")
      .eq("id", pendingOrder.course_id)
      .single();

    return {
      success: true,
      courseSlug: course?.slug,
      courseTitle: course?.title,
    };
  } catch (err) {
    if (err instanceof PortOneApiError) {
      console.error("포트원 결제 검증 오류:", err.code, err.message);
      return { success: false, error: err.message };
    }
    console.error("결제 검증 오류:", err);
    return { success: false, error: "결제 검증에 실패했습니다." };
  }
}

// 1:1 문의 접근 권한 확인: 로그인 + 유료 결제건 보유 수강생만 허용
export async function getInquiryEligibility(): Promise<{
  loggedIn: boolean;
  hasPaidCourse: boolean;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { loggedIn: false, hasPaidCourse: false };
  }

  // 결제완료 + 미환불 건 중 실결제액(결제금액 - 환불금액)이 0원을 넘는 건이 있는지 확인
  const { data } = await supabase
    .from("course_purchases")
    .select("amount, refunded_amount")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .eq("is_refunded", false);

  const hasPaidCourse = (data || []).some(
    (p) => (p.amount || 0) - (p.refunded_amount || 0) > 0
  );

  return { loggedIn: true, hasPaidCourse };
}

// 유저의 구매한 코스 목록
export async function getUserCoursePurchases(): Promise<CoursePurchase[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("course_purchases")
    .select(
      `
      *,
      course:courses(
        *,
        chapters(
          id,
          lessons(id, duration_seconds)
        )
      )
    `
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("구매 코스 조회 오류:", error);
    return [];
  }

  // 레슨 수/총 시간 집계
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((purchase: any) => {
    const course = purchase.course;
    if (course) {
      const chapters = (course.chapters as { id: string; lessons: { id: string; duration_seconds: number }[] }[]) || [];
      let lessonCount = 0;
      let totalDuration = 0;
      for (const ch of chapters) {
        lessonCount += (ch.lessons || []).length;
        for (const l of ch.lessons || []) {
          totalDuration += l.duration_seconds || 0;
        }
      }
      delete course.chapters;
      purchase.course = {
        ...course,
        lesson_count: lessonCount,
        total_duration: totalDuration,
      };
    }
    return purchase as CoursePurchase;
  });
}
