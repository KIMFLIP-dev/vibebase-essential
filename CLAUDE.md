# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npx tsc --noEmit # Type check
```

시크릿 없이 프로덕션 빌드를 검증할 때는 `SKIP_ENV_VALIDATION=1 npm run build`.

## Architecture

Next.js 15+ App Router + Supabase(인증/DB/스토리지) + PortOne V2 단건 결제 +
shadcn/ui(new-york, Zinc) + Tailwind CSS 4 기반의 SaaS essential 템플릿.

### Supabase Client Setup

`lib/supabase/`에 3개의 클라이언트가 있다:
- `server.ts` — 서버 컴포넌트/서버 액션용 `createClient()`(요청마다 새로 생성) +
  service_role용 `createAdminClient()` (RLS 우회, 서버 전용)
- `client.ts` — 클라이언트 컴포넌트용 (`createBrowserClient`)
- `proxy.ts` — 미들웨어(루트 `proxy.ts`)에서 호출하는 `updateSession()`.
  세션 갱신 + 라우트 보호. `getClaims()`를 다른 코드보다 먼저 호출해야 한다.

### 인증·권한 (중요)

- **role은 반드시 `app_metadata`에서만 읽고 쓴다.** `user_metadata`는 사용자가
  `updateUser()`로 직접 수정할 수 있어 권한 판별에 쓰면 권한 상승 취약점이 된다.
  RLS 정책도 전부 `auth.jwt() -> 'app_metadata' ->> 'role'` 기준.
- 역할: `user`(기본) / `admin`(조회·관리) / `super_admin`(삭제·역할 변경·설정)
- 역할 부여는 서버에서만: `auth.admin.updateUserById(id, { app_metadata: { role } })`
- 헬퍼: `lib/admin/auth.ts`의 `isAdmin()` / `requireAdmin()` / `requireSuperAdmin()`
- 공개 라우트 화이트리스트는 `lib/supabase/proxy.ts` 참고
  (`/`, `/auth`, `/blog`, `/products`, `/download`, `/legal`, `/api/webhooks` 등)
- 가입 시 약관·마케팅 동의는 `user_consents` 테이블에 기록 (service_role 전용 쓰기,
  마케팅 토글은 UPDATE-only — 필수 동의 일시를 위조하지 않기 위함)

### PortOne V2 단건 결제

결제 흐름 (금액 변조 방어 3단계):
1. `app/products/actions.ts#createPendingOrder` — 서버가 `pending_orders`에
   금액 고정 (30분 만료, 유효한 기존 주문 재사용)
2. `components/products/portone-payment-widget.tsx` — 위젯 결제.
   **`customData: { orderId }`를 반드시 포함** (웹훅 매칭 + 결속 검증용)
3. `confirmAndSavePurchase` — PortOne API 재조회로 상태·금액·통화 검증 +
   `customData.orderId` 결속 검증 후 `product_purchases` 저장.
   `portone_payment_id UNIQUE`가 웹훅과의 이중 저장을 막는다.

웹훅 `app/api/webhooks/portone/route.ts`:
- **Standard Webhooks 서명 검증** (`lib/portone/webhook.ts`, `PORTONE_WEBHOOK_SECRET`) —
  실패 시 401. 검증은 raw body 기준이므로 `request.text()` 순서를 바꾸지 말 것
- webhook body를 신뢰하지 않고 `getPayment()`로 재조회
- 테스트/운영 전환은 PortOne 콘솔의 채널 단위 — `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`만
  교체 (Vercel은 `NEXT_PUBLIC_*`이 빌드 타임 인라인이라 재배포 필요)

환불: `app/admin/purchases/actions.ts#refundPurchase` — `cancelPayment()` 후 DB 반영.
rowcount 기반으로 웹훅과의 이메일 중복 발송을 막는다.

### 트랜잭셔널 이메일 (옵셔널)

- `lib/email/send.ts` — `RESEND_API_KEY`/`EMAIL_FROM` 미설정이면 조용히 스킵.
  발송 실패는 로그만 남기고 **본 흐름(결제/환불/답변)을 절대 막지 않는다.**
  수신자 조회가 필요하면 `sendEmailToUser()`를 쓸 것 (조회 실패까지 삼킨다)
- 템플릿: `lib/email/templates/` (@react-email/components, 서버 액션에서는
  JSX 없이 함수 호출로 사용)

### Database Schema

`install.sql` = `supabase/migrations/0000_init.sql` (항상 동일하게 유지).
테이블 8개: `site_settings`, `products`, `pending_orders`, `product_purchases`,
`posts`, `download_items`, `inquiries`, `user_consents`.
Storage 버킷: `blog-images`(공개), `avatars`(공개), `download-files`(비공개).

- 스키마 변경 시: 새 마이그레이션 파일 추가 + `install.sql`에도 반영
  (신규 설치는 install.sql 1회 실행으로 끝나야 한다)
- 정책은 `DROP POLICY IF EXISTS` 후 생성 — 재실행 안전
- 회원 탈퇴 시 `product_purchases.user_id`는 SET NULL로 보존(전자상거래법),
  `product_name` 스냅샷이 있어 상품 삭제 후에도 기록이 유의미하다

### Server Actions Pattern

라우트마다 colocated `actions.ts`:
- `app/products/actions.ts` — 상품 조회 + 결제 (핵심)
- `app/admin/*/actions.ts` — 어드민 (모두 `requireAdmin()` 선행)
- `app/mypage/actions.ts` — 아바타·동의·탈퇴
- `app/auth/actions.ts` — 가입+동의 기록

NUMERIC 칼럼(amount, price)은 supabase-js가 문자열로 반환할 수 있으므로
비교·표시 전에 `Number()`로 정규화한다.

### Component Organization

- `components/ui/` — shadcn/ui 프리미티브
- `components/common/` — navbar, mobile-nav, user-menu, auth-button, 공지 배너
- `components/admin/` — 어드민 테이블·폼·다이얼로그
- `components/{products,blog,download,auth,landing}/` — 도메인별

### 테마

공개 페이지 디자인이 라이트 브랜드 고정(#F9F9FB, #111, #B7B2FF)이라
`ThemeProvider`에 `forcedTheme="light"`. 다크모드를 도입하려면 forcedTheme 제거 +
하드코딩 색상의 시맨틱 토큰 치환이 필요하다.

## Environment Variables

`.env.example` 참고. 필수 키 누락은 `lib/env.ts`(zod)가 기동 시 검증한다
(dev는 누락 키를 경고만 하고 계속 진행, prod 빌드/실행은 fail-fast,
`SKIP_ENV_VALIDATION=1`로 우회).

## Database Setup

Supabase SQL Editor에서 `install.sql` 1회 실행. 첫 관리자:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

실행 후 로그아웃 → 재로그인 필수. (user_metadata가 아니라 **app_metadata**다)
