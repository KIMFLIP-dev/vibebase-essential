"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Clock, Lock, PlayCircle } from "lucide-react";
import { formatDuration } from "@/lib/vimeo/client";
import type { Lesson } from "@/lib/types/course";
import { cn } from "@/lib/utils";

interface LessonItemProps {
  lesson: Lesson;
  purchased: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function LessonItem({
  lesson,
  purchased,
  isActive,
  onClick,
}: LessonItemProps) {
  const isComingSoon = lesson.is_coming_soon;
  const canAccess = !isComingSoon && (lesson.is_free || purchased);

  return (
    <button
      onClick={isComingSoon ? undefined : onClick}
      disabled={isComingSoon}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
        !isComingSoon && "hover:bg-accent/50",
        isActive && "bg-accent",
        !canAccess && "opacity-70",
        isComingSoon && "cursor-default"
      )}
    >
      <div className="relative w-16 h-9 flex-shrink-0 rounded overflow-hidden bg-muted">
        {isComingSoon ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        ) : lesson.thumbnail_url ? (
          <Image
            src={lesson.thumbnail_url}
            alt={lesson.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {canAccess ? (
              <PlayCircle className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isComingSoon ? "text-muted-foreground" : "text-foreground"
        )}>
          {lesson.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {!isComingSoon && lesson.duration_seconds > 0 && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(lesson.duration_seconds)}
            </span>
          )}
          {isComingSoon && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4"
            >
              커밍순
            </Badge>
          )}
          {!isComingSoon && lesson.is_free && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 !bg-green-100 !text-green-700"
            >
              무료
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        {isComingSoon ? (
          <Clock className="w-4 h-4 text-muted-foreground" />
        ) : canAccess ? (
          <PlayCircle className="w-4 h-4 text-primary" />
        ) : (
          <Lock className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
