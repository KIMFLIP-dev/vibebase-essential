"use client";

interface VideoPlayerProps {
  vimeoVideoId: string;
}

export function VideoPlayer({ vimeoVideoId }: VideoPlayerProps) {
  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        src={`https://player.vimeo.com/video/${vimeoVideoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
        title="Video Player"
      />
    </div>
  );
}
