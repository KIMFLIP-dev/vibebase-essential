import { Link, Text } from "@react-email/components";
import { BaseLayout, textStyle, boxStyle, buttonStyle } from "./base-layout";

interface InquiryAnsweredEmailProps {
  inquiryTitle: string;
  siteUrl: string;
}

// 1:1 문의 답변 알림 메일 (답변 내용은 메일에 싣지 않고 사이트로 유도)
export function InquiryAnsweredEmail({
  inquiryTitle,
  siteUrl,
}: InquiryAnsweredEmailProps) {
  return (
    <BaseLayout
      preview="문의하신 내용에 답변이 등록되었습니다."
      heading="문의 답변이 도착했습니다"
    >
      <Text style={textStyle}>문의하신 내용에 답변이 등록되었습니다.</Text>

      <div style={boxStyle}>
        <Text style={{ fontSize: "14px", fontWeight: 700, color: "#111111", margin: 0 }}>
          {inquiryTitle}
        </Text>
      </div>

      <Text style={{ textAlign: "center", margin: "24px 0 0" }}>
        <Link href={`${siteUrl}/mypage/inquiries`} style={buttonStyle}>
          답변 확인하기
        </Link>
      </Text>
    </BaseLayout>
  );
}
