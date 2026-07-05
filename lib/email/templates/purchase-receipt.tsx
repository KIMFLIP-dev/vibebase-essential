import { Link, Text } from "@react-email/components";
import {
  BaseLayout,
  textStyle,
  boxStyle,
  rowLabelStyle,
  rowValueStyle,
  buttonStyle,
} from "./base-layout";

interface PurchaseReceiptEmailProps {
  productName: string;
  amount: number;
  orderId: string;
  receiptUrl?: string | null;
  siteUrl: string;
}

// 구매 완료 영수증 메일
export function PurchaseReceiptEmail({
  productName,
  amount,
  orderId,
  receiptUrl,
  siteUrl,
}: PurchaseReceiptEmailProps) {
  return (
    <BaseLayout
      preview={`${productName} 구매가 완료되었습니다.`}
      heading="구매가 완료되었습니다 🎉"
    >
      <Text style={textStyle}>
        구매해 주셔서 감사합니다. 결제 내역을 안내드립니다.
      </Text>

      <div style={boxStyle}>
        <Text style={rowLabelStyle}>상품명</Text>
        <Text style={rowValueStyle}>{productName}</Text>
        <Text style={rowLabelStyle}>결제 금액</Text>
        <Text style={rowValueStyle}>{amount.toLocaleString()}원</Text>
        <Text style={rowLabelStyle}>주문 번호</Text>
        <Text style={{ ...rowValueStyle, margin: 0, fontFamily: "monospace" }}>
          {orderId}
        </Text>
      </div>

      <Text style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={`${siteUrl}/mypage/purchases`} style={buttonStyle}>
          구매 내역 보기
        </Link>
      </Text>

      {receiptUrl && (
        <Text style={{ ...textStyle, textAlign: "center", margin: "8px 0 0" }}>
          <Link
            href={receiptUrl}
            style={{ color: "#888888", fontSize: "12px", textDecoration: "underline" }}
          >
            매출전표 확인
          </Link>
        </Text>
      )}
    </BaseLayout>
  );
}
