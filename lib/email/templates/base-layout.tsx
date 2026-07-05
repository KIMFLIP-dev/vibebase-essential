import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface BaseLayoutProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

// 모든 트랜잭셔널 메일의 공통 레이아웃
export function BaseLayout({ preview, heading, children }: BaseLayoutProps) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#F9F9FB", fontFamily: "sans-serif" }}>
        <Container
          style={{
            maxWidth: "480px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #111111",
            padding: "32px",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              fontWeight: 900,
              fontStyle: "italic",
              color: "#111111",
              margin: "0 0 24px",
            }}
          >
            VibeBase
          </Text>

          <Heading
            style={{
              fontSize: "20px",
              fontWeight: 900,
              color: "#111111",
              margin: "0 0 16px",
            }}
          >
            {heading}
          </Heading>

          <Section>{children}</Section>

          <Hr style={{ borderColor: "#eeeeee", margin: "24px 0 16px" }} />
          <Text style={{ fontSize: "11px", color: "#999999", margin: 0 }}>
            본 메일은 발신 전용입니다. 문의는 마이페이지 1:1 문의를 이용해주세요.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const textStyle = {
  fontSize: "14px",
  color: "#333333",
  lineHeight: "1.6",
  margin: "0 0 12px",
} as const;

export const boxStyle = {
  backgroundColor: "#F9F9FB",
  borderRadius: "12px",
  padding: "16px",
  margin: "16px 0",
} as const;

export const rowLabelStyle = {
  fontSize: "12px",
  color: "#888888",
  margin: "0 0 2px",
} as const;

export const rowValueStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#111111",
  margin: "0 0 10px",
} as const;

export const buttonStyle = {
  display: "inline-block",
  backgroundColor: "#111111",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  padding: "12px 28px",
  borderRadius: "9999px",
  textDecoration: "none",
} as const;
