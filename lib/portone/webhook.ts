import { createHmac, timingSafeEqual } from "node:crypto";

// =====================================================
// PortOne V2 웹훅 서명 검증 (Standard Webhooks 규격)
// https://developers.portone.io/opi/ko/integration/webhook/readme-v2
//
// 헤더: webhook-id / webhook-timestamp / webhook-signature
// 서명: base64(HMAC-SHA256(base64decode(secret), `${id}.${timestamp}.${body}`))
// webhook-signature 값은 "v1,<sig>" 목록(공백 구분)
// =====================================================

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60; // 5분

export function verifyPortOneWebhook(
  rawBody: string,
  headers: {
    webhookId: string | null;
    webhookTimestamp: string | null;
    webhookSignature: string | null;
  }
): { valid: boolean; reason?: string } {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!secret) {
    return { valid: false, reason: "PORTONE_WEBHOOK_SECRET 미설정" };
  }

  const { webhookId, webhookTimestamp, webhookSignature } = headers;
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return { valid: false, reason: "서명 헤더 누락" };
  }

  // 재전송 공격 방지: 타임스탬프 허용 오차 확인
  const timestampSeconds = Number(webhookTimestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return { valid: false, reason: "타임스탬프 형식 오류" };
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > TIMESTAMP_TOLERANCE_SECONDS) {
    return { valid: false, reason: "타임스탬프 허용 오차 초과" };
  }

  // 시크릿은 "whsec_" 프리픽스 뒤 base64 문자열
  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret,
    "base64"
  );
  if (secretBytes.length === 0) {
    return { valid: false, reason: "시크릿 형식 오류" };
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes)
    .update(signedContent, "utf8")
    .digest();

  // "v1,<sig> v1a,<sig> ..." 목록에서 v1 서명들과 비교
  const candidates = webhookSignature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const commaIndex = part.indexOf(",");
      if (commaIndex < 0) return null;
      return {
        version: part.slice(0, commaIndex),
        signature: part.slice(commaIndex + 1),
      };
    })
    .filter((entry): entry is { version: string; signature: string } =>
      entry !== null && entry.version === "v1"
    );

  for (const candidate of candidates) {
    let candidateBytes: Buffer;
    try {
      candidateBytes = Buffer.from(candidate.signature, "base64");
    } catch {
      continue;
    }
    if (
      candidateBytes.length === expected.length &&
      timingSafeEqual(candidateBytes, expected)
    ) {
      return { valid: true };
    }
  }

  return { valid: false, reason: "서명 불일치" };
}
