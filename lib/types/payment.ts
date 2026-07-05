// =====================================================
// 포트원 V2 결제 관련 타입 정의
// =====================================================

export type PortOnePaymentStatus =
  | "PAID"
  | "CANCELLED"
  | "FAILED"
  | "READY"
  | "VIRTUAL_ACCOUNT_ISSUED"
  | "PARTIAL_CANCELLED";

export interface PortOnePaymentAmount {
  total: number;
  paid: number;
  cancelled: number;
  taxFree: number;
}

export interface PortOnePaymentCancellation {
  id: string;
  reason: string;
  cancelledAt: string;
  totalAmount: number;
  taxFreeAmount: number;
  status: string;
}

export interface PortOnePayment {
  id: string;
  status: PortOnePaymentStatus;
  amount: PortOnePaymentAmount;
  currency: string;
  method?: { type: string };
  orderName?: string;
  cancellations?: PortOnePaymentCancellation[];
  channel?: {
    key: string;
    name: string;
    type: string;
  };
  requestedAt?: string;
  paidAt?: string;
  customData?: string; // 결제 요청 시 넣은 JSON 문자열 (orderId 매칭용)
  receiptUrl?: string; // 매출전표 URL
}

export interface CancelPaymentRequest {
  cancelReason: string;
  cancelAmount?: number;
}
