"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LessonItem } from "@/components/courses/lesson-item";
import type { ChapterWithLessons } from "@/lib/types/course";

interface LessonListProps {
  chapters: ChapterWithLessons[];
  purchased: boolean;
  activeLessonId?: string;
  onLessonClick?: (lessonId: string, isFree: boolean) => void;
}

export function LessonList({
  chapters,
  purchased,
  activeLessonId,
  onLessonClick,
}: LessonListProps) {
  // Default open all chapters
  const defaultValues = chapters.map((ch) => ch.id);

  return (
    <Accordion type="multiple" defaultValue={defaultValues} className="w-full">
      {chapters.map((chapter) => (
        <AccordionItem key={chapter.id} value={chapter.id}>
          <AccordionTrigger className="text-sm font-medium px-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span>{chapter.title}</span>
              <span className="text-xs text-muted-foreground font-normal">
                ({chapter.lessons.length}강)
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-1">
            <div className="space-y-0.5">
              {chapter.lessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  purchased={purchased}
                  isActive={activeLessonId === lesson.id}
                  onClick={() =>
                    onLessonClick?.(lesson.id, lesson.is_free)
                  }
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
