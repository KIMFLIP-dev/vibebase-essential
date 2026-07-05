import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

interface Props {
  content: string;
}

// DB의 마크다운 원문을 안전하게 HTML로 렌더.
// 순서 주의: sanitize(사용자 입력 정화) → highlight(안전한 클래스 추가).
export function MarkdownContent({ content }: Props) {
  return (
    <article className="prose prose-zinc max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-[#7C3AED] prose-img:rounded-xl prose-pre:rounded-xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
