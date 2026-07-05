import { Text } from "@react-email/components";
import {
  BaseLayout,
  textStyle,
  boxStyle,
  rowLabelStyle,
  rowValueStyle,
} from "./base-layout";

interface RefundNoticeEmailProps {
  productName: string;
  refundedAmount: number;
  orderId: string;
}

// 환불 완료 알림 메일
export function RefundNoticeEmail({
  productName,
  refundedAmount,
  orderId,
}: RefundNoticeEmailProps) {
  return (
    <BaseLayout
      preview={`${productName} 환불이 완료되었습니다.`}
      heading="환불이 완료되었습니다"
    >
      <Text style={textStyle}>
        요청하신 결제 취소가 처리되었습니다. 환불 금액은 결제 수단에 따라
        영업일 기준 3~7일 내에 입금됩니다.
      </Text>

      <div style={boxStyle}>
        <Text style={rowLabelStyle}>상품명</Text>
        <Text style={rowValueStyle}>{productName}</Text>
        <Text style={rowLabelStyle}>환불 금액</Text>
        <Text style={rowValueStyle}>{refundedAmount.toLocaleString()}원</Text>
        <Text style={rowLabelStyle}>주문 번호</Text>
        <Text style={{ ...rowValueStyle, margin: 0, fontFamily: "monospace" }}>
          {orderId}
        </Text>
      </div>
    </BaseLayout>
  );
}
