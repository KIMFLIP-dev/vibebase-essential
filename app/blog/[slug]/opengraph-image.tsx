import { ImageResponse } from "next/og";
import { getPostBySlug } from "../actions";

export const alt = "블로그 글";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

// 커버 이미지가 없는 글을 위한 자동 생성 OG 이미지
export default async function OpengraphImage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post?.title ?? "블로그";
  const tags = post?.tags?.slice(0, 3) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#111111",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                backgroundColor: "#B7B2FF",
                color: "#111111",
                borderRadius: 9999,
                padding: "8px 24px",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              #{tag}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 56 : 72,
            fontWeight: 900,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "#B7B2FF",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 28,
            }}
          >
            {"</>"}
          </div>
          VibeBase
        </div>
      </div>
    ),
    size
  );
}
