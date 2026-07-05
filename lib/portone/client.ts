import type {
  PortOnePayment,
  CancelPaymentRequest,
} from "@/lib/types/payment";

const PORTONE_API_URL = "https://api.portone.io";
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;

function getAuthHeader(): string {
  if (!PORTONE_API_SECRET) {
    throw new Error("PORTONE_API_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return `PortOne ${PORTONE_API_SECRET}`;
}

export class PortOneApiError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "PortOneApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * 결제 단건 조회
 * GET https://api.portone.io/payments/{paymentId}
 */
export async function getPayment(paymentId: string): Promise<PortOnePayment> {
  const url = `${PORTONE_API_URL}/payments/${encodeURIComponent(paymentId)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new PortOneApiError(
      error.code || "UNKNOWN",
      error.message || "결제 조회에 실패했습니다.",
      response.status
    );
  }

  return response.json();
}

/**
 * 결제 취소 (전액 또는 부분)
 * POST https://api.portone.io/payments/{paymentId}/cancel
 */
export async function cancelPayment(
  paymentId: string,
  params: CancelPaymentRequest
): Promise<PortOnePayment> {
  const url = `${PORTONE_API_URL}/payments/${encodeURIComponent(paymentId)}/cancel`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      reason: params.cancelReason,
      ...(params.cancelAmount && { amount: params.cancelAmount }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new PortOneApiError(
      error.code || "UNKNOWN",
      error.message || "결제 취소에 실패했습니다.",
      response.status
    );
  }

  return response.json();
}

/**
 * 포트원 설정 여부 확인
 */
export function isPortOneConfigured(): boolean {
  return (
    !!PORTONE_API_SECRET &&
    !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID &&
    !!process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
  );
}
