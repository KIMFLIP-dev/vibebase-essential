"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import { getVimeoMetadata } from "@/lib/vimeo/client";
import type {
  Course,
  Chapter,
  Lesson,
  ChapterWithLessons,
  CourseWithChapters,
} from "@/lib/types/course";

// =====================================================
// 코스 CRUD
// =====================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `course-${Date.now()}`;
}

export async function getAdminCourses(): Promise<Course[]> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // 각 코스의 레슨 수와 총 시간 계산
  const coursesWithStats = await Promise.all(
    (courses as Course[]).map(async (course) => {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("duration_seconds, chapter_id")
        .in(
          "chapter_id",
          (
            await supabase
              .from("chapters")
              .select("id")
              .eq("course_id", course.id)
          ).data?.map((c: { id: string }) => c.id) || []
        );

      return {
        ...course,
        lesson_count: lessons?.length || 0,
        total_duration: lessons?.reduce(
          (sum: number, l: { duration_seconds: number }) => sum + (l.duration_seconds || 0),
          0
        ) || 0,
      };
    })
  );

  return coursesWithStats;
}

export async function getAdminCourse(id: string): Promise<CourseWithChapters | null> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  // 챕터 조회
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .eq("course_id", id)
    .order("display_order", { ascending: true });

  if (chaptersError) {
    throw new Error(chaptersError.message);
  }

  // 각 챕터의 레슨 조회
  const chaptersWithLessons: ChapterWithLessons[] = await Promise.all(
    (chapters as Chapter[]).map(async (chapter) => {
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("display_order", { ascending: true });

      if (lessonsError) {
        throw new Error(lessonsError.message);
      }

      return {
        ...chapter,
        lessons: (lessons as Lesson[]) || [],
      };
    })
  );

  return {
    ...(course as Course),
    chapters: chaptersWithLessons,
  };
}

export async function createCourse(formData: {
  title: string;
  slug?: string;
  description?: string | null;
  short_description?: string | null;
  thumbnail_url?: string | null;
  price: number;
  original_price?: number | null;
  currency?: string;
  is_published?: boolean;
  is_coming_soon?: boolean;
  display_order?: number;
  source_code_url?: string | null;
}): Promise<Course> {
  await requireAdmin();

  if (!formData.title || formData.title.trim().length === 0) {
    throw new Error("코스 제목을 입력해주세요.");
  }

  if (formData.price < 0) {
    throw new Error("가격은 0 이상이어야 합니다.");
  }

  const slug = formData.slug?.trim() || generateSlug(formData.title);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .insert({
      title: formData.title.trim(),
      slug,
      description: formData.description?.trim() || null,
      short_description: formData.short_description?.trim() || null,
      thumbnail_url: formData.thumbnail_url?.trim() || null,
      price: formData.price,
      original_price: formData.original_price ?? null,
      currency: formData.currency || "KRW",
      is_published: formData.is_published ?? false,
      is_coming_soon: formData.is_coming_soon ?? false,
      display_order: formData.display_order || 0,
      source_code_url: formData.source_code_url?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");

  return data as Course;
}

export async function updateCourse(
  id: string,
  formData: {
    title?: string;
    slug?: string;
    description?: string | null;
    short_description?: string | null;
    thumbnail_url?: string | null;
    price?: number;
    original_price?: number | null;
    currency?: string;
    is_published?: boolean;
    is_coming_soon?: boolean;
    display_order?: number;
    source_code_url?: string | null;
  }
): Promise<Course> {
  await requireAdmin();

  if (formData.title !== undefined && formData.title.trim().length === 0) {
    throw new Error("코스 제목을 입력해주세요.");
  }

  if (formData.price !== undefined && formData.price < 0) {
    throw new Error("가격은 0 이상이어야 합니다.");
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};

  if (formData.title !== undefined) updateData.title = formData.title.trim();
  if (formData.slug !== undefined) updateData.slug = formData.slug.trim();
  if (formData.description !== undefined) updateData.description = formData.description?.trim() || null;
  if (formData.short_description !== undefined) updateData.short_description = formData.short_description?.trim() || null;
  if (formData.thumbnail_url !== undefined) updateData.thumbnail_url = formData.thumbnail_url?.trim() || null;
  if (formData.price !== undefined) updateData.price = formData.price;
  if (formData.original_price !== undefined) updateData.original_price = formData.original_price;
  if (formData.currency !== undefined) updateData.currency = formData.currency;
  if (formData.is_published !== undefined) updateData.is_published = formData.is_published;
  if (formData.is_coming_soon !== undefined) updateData.is_coming_soon = formData.is_coming_soon;
  if (formData.display_order !== undefined) updateData.display_order = formData.display_order;
  if (formData.source_code_url !== undefined) updateData.source_code_url = formData.source_code_url?.trim() || null;

  const { data, error } = await supabase
    .from("courses")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}`);

  return data as Course;
}

export async function deleteCourse(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");
}

export async function toggleCoursePublished(id: string): Promise<Course> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("courses")
    .select("is_published")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { data, error } = await supabase
    .from("courses")
    .update({ is_published: !current.is_published })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");

  return data as Course;
}

// =====================================================
// 챕터 CRUD
// =====================================================

export async function createChapter(
  courseId: string,
  title: string
): Promise<Chapter> {
  await requireAdmin();

  if (!title || title.trim().length === 0) {
    throw new Error("챕터 제목을 입력해주세요.");
  }

  const supabase = await createClient();

  // 현재 최대 display_order 조회
  const { data: maxOrder } = await supabase
    .from("chapters")
    .select("display_order")
    .eq("course_id", courseId)
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.display_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      course_id: courseId,
      title: title.trim(),
      display_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");

  return data as Chapter;
}

export async function updateChapter(
  id: string,
  title: string
): Promise<Chapter> {
  await requireAdmin();

  if (!title || title.trim().length === 0) {
    throw new Error("챕터 제목을 입력해주세요.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .update({ title: title.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");

  return data as Chapter;
}

export async function deleteChapter(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");
}

export async function reorderChapters(
  courseId: string,
  orderedIds: string[]
): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("chapters")
      .update({ display_order: i })
      .eq("id", orderedIds[i])
      .eq("course_id", courseId);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/admin/courses");
}

// =====================================================
// 레슨 CRUD
// =====================================================

export async function createLesson(
  chapterId: string,
  data: {
    title: string;
    description?: string | null;
    vimeo_video_id?: string | null;
    thumbnail_url?: string | null;
    duration_seconds?: number;
    is_free?: boolean;
    is_coming_soon?: boolean;
  }
): Promise<Lesson> {
  await requireAdmin();

  if (!data.title || data.title.trim().length === 0) {
    throw new Error("레슨 제목을 입력해주세요.");
  }

  const supabase = await createClient();

  // 현재 최대 display_order 조회
  const { data: maxOrder } = await supabase
    .from("lessons")
    .select("display_order")
    .eq("chapter_id", chapterId)
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.display_order ?? -1) + 1;

  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      chapter_id: chapterId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      vimeo_video_id: data.vimeo_video_id?.trim() || null,
      thumbnail_url: data.thumbnail_url?.trim() || null,
      duration_seconds: data.duration_seconds || 0,
      is_free: data.is_free ?? false,
      is_coming_soon: data.is_coming_soon ?? false,
      display_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");

  return lesson as Lesson;
}

export async function updateLesson(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    vimeo_video_id?: string | null;
    thumbnail_url?: string | null;
    duration_seconds?: number;
    is_free?: boolean;
    is_coming_soon?: boolean;
  }
): Promise<Lesson> {
  await requireAdmin();

  if (data.title !== undefined && data.title.trim().length === 0) {
    throw new Error("레슨 제목을 입력해주세요.");
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.vimeo_video_id !== undefined) updateData.vimeo_video_id = data.vimeo_video_id?.trim() || null;
  if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url?.trim() || null;
  if (data.duration_seconds !== undefined) updateData.duration_seconds = data.duration_seconds;
  if (data.is_free !== undefined) updateData.is_free = data.is_free;
  if (data.is_coming_soon !== undefined) updateData.is_coming_soon = data.is_coming_soon;

  const { data: lesson, error } = await supabase
    .from("lessons")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");

  return lesson as Lesson;
}

export async function deleteLesson(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");
}

export async function reorderLessons(
  chapterId: string,
  orderedIds: string[]
): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("lessons")
      .update({ display_order: i })
      .eq("id", orderedIds[i])
      .eq("chapter_id", chapterId);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/admin/courses");
}

// =====================================================
// Vimeo 메타데이터 조회
// =====================================================

export async function fetchVimeoMetadata(videoId: string) {
  await requireAdmin();

  if (!videoId || videoId.trim().length === 0) {
    throw new Error("Vimeo Video ID를 입력해주세요.");
  }

  try {
    const metadata = await getVimeoMetadata(videoId.trim());
    return metadata;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Vimeo 메타데이터 조회에 실패했습니다."
    );
  }
}

// =====================================================
// 소스코드 파일 업로드/삭제 (Supabase Storage)
// =====================================================

const SOURCE_CODE_BUCKET = "source-codes";

export async function uploadSourceCode(
  courseId: string,
  formData: FormData
): Promise<string> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("파일을 선택해주세요.");
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 기존 파일이 있으면 삭제
  const { data: course } = await supabase
    .from("courses")
    .select("source_code_url")
    .eq("id", courseId)
    .single();

  if (course?.source_code_url) {
    await adminClient.storage
      .from(SOURCE_CODE_BUCKET)
      .remove([course.source_code_url]);
  }

  const storagePath = `${courseId}/${file.name}`;

  const { error: uploadError } = await adminClient.storage
    .from(SOURCE_CODE_BUCKET)
    .upload(storagePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`파일 업로드 실패: ${uploadError.message}`);
  }

  // DB 업데이트
  const { error: updateError } = await adminClient
    .from("courses")
    .update({ source_code_url: storagePath })
    .eq("id", courseId);

  if (updateError) {
    throw new Error(`DB 업데이트 실패: ${updateError.message}`);
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);

  return storagePath;
}

export async function deleteSourceCode(courseId: string): Promise<void> {
  await requireAdmin();

  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 현재 파일 경로 조회
  const { data: course } = await supabase
    .from("courses")
    .select("source_code_url")
    .eq("id", courseId)
    .single();

  if (course?.source_code_url) {
    await adminClient.storage
      .from(SOURCE_CODE_BUCKET)
      .remove([course.source_code_url]);
  }

  // DB 업데이트
  const { error: updateError } = await adminClient
    .from("courses")
    .update({ source_code_url: null })
    .eq("id", courseId);

  if (updateError) {
    throw new Error(`DB 업데이트 실패: ${updateError.message}`);
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}
