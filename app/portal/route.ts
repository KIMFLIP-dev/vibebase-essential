import { Portal } from "@creem_io/nextjs";

const isTestMode = (process.env.CREEM_API_URL || "").includes("test-api.creem.io");

/**
 * Creem 고객 포털 리다이렉트
 * - /portal 접속 시 Creem 고객 포털로 이동
 * - 사용자가 구독 관리, 결제 수단 변경, 청구 내역 확인 가능
 */
export const GET = Portal({
  apiKey: process.env.CREEM_API_KEY!,
  testMode: isTestMode,
});
