# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a Next.js 15+ App Router project with Supabase authentication, Creem payment integration, using shadcn/ui components and Tailwind CSS.

### Supabase Client Setup

Four Supabase clients exist in `lib/supabase/`:
- `server.ts` - Server Components/Server Actions. Always create a new client per request (important for Fluid compute). Also exports `createAdminClient()` for service_role operations.
- `client.ts` - Client Components. Uses `createBrowserClient`.
- `proxy.ts` - Middleware proxy for session refresh. The `updateSession()` function must call `supabase.auth.getClaims()` before any other code. Also handles route protection: redirects unauthenticated users to `/auth/login` and checks admin roles for `/admin/*` paths.
- `admin.ts` - Admin client with service_role key for bypassing RLS. Server-side only.

### Authentication & Authorization

- Auth pages live in `app/auth/` (login, sign-up, forgot-password, update-password)
- Protected routes: All non-auth routes require authentication (enforced in `lib/supabase/proxy.ts`)
- Admin routes at `app/admin/` require `admin` or `super_admin` role in `user_metadata`
- Auth forms are client components that use `lib/supabase/client.ts` directly
- Role helpers in `lib/admin/auth.ts`: `isAdmin()`, `isSuperAdmin()`, `requireAdmin()`, `requireSuperAdmin()`

### Role System

Roles are stored in `auth.users.raw_user_meta_data.role`:
- `user` - Default role
- `admin` - Can view/edit users
- `super_admin` - Can delete users, manage roles, update site settings

### Creem Payment Integration

- `lib/creem/client.ts` - Singleton Creem API client (`getCreemClient()`) for products, checkouts, subscriptions, transactions
- `app/api/webhooks/creem/route.ts` - Webhook handler for subscription lifecycle events (subscription.created/updated/cancelled/renewed, payment.failed, checkout.completed)
- `app/portal/route.ts` - Redirects to Creem customer portal for subscription management
- Supports both recurring subscriptions and one-time purchases (`billing_type` field)

### PortOne Payment Integration (강의 결제)

PortOne V2 SDK 기반. 코드에 환경 분기가 없으며, **테스트/운영 전환은 채널(Channel) 단위**로 PortOne 콘솔에서 관리한다.

- `lib/portone/client.ts` - PortOne V2 REST API 래퍼 (`getPayment`, `cancelPayment`, `isPortOneConfigured`)
- `components/courses/portone-payment-widget.tsx` - 결제 위젯 (카카오페이 EASY_PAY)
- `app/api/webhooks/portone/route.ts` - 웹훅 (Transaction.Paid/Cancelled 등)
- `app/courses/actions.ts` - `confirmAndSavePurchase`로 결제 검증 + DB 저장

**테스트 → 운영 전환 시**:
1. PortOne 콘솔에서 운영 PG 채널 추가 후 새 Channel Key 발급
2. `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`만 운영 키로 교체 (Store ID, API Secret은 보통 동일)
3. 운영 채널에도 webhook URL(`/api/webhooks/portone`) 등록
4. Vercel 환경변수는 변경 후 **재배포해야 적용** (`NEXT_PUBLIC_*`은 빌드 타임에 인라인됨)

### Download Cards (`/download` 페이지)

`/download` 페이지의 카드는 `download_items` 테이블에서 동적으로 렌더링되며, 어드민 `/admin/downloads`에서 CRUD 가능.

- `app/download/page.tsx` - 사용자 페이지 (서버 컴포넌트, `getPublishedDownloads` 호출)
- `app/download/actions.ts` - public fetch (`getPublishedDownloads`)
- `app/admin/downloads/{page,new/page,[id]/page,actions}.tsx` - 어드민 CRUD
- `app/api/downloads/[id]/file/route.ts` - 파일 다운로드 (signed URL 5분 만료)
- `components/download/download-card.tsx` - 카드 컴포넌트 (light/dark variant)
- `components/download/youtube-thumbnail-badge.tsx` - YouTube 미니 썸네일 배지
- `lib/youtube.ts` - YouTube URL → video ID 추출 (`extractYoutubeVideoId`, `getYoutubeThumbnailUrl`)
- Storage: 비공개 버킷 `download-files`, `<id>/<filename>` 경로
- 가이드 문서 링크는 download 시스템과 별개로 `components/landing/footer.tsx`에 하드코딩됨

유료 다운로드 카드는 스키마/UI까지 Phase 1에서 지원 (스타일·"유료" 배지·"곧 출시" 버튼). 결제 연동은 Phase 2 예정 — `plan-download.md`의 "Phase 2 TODO" 참고.

### Database Schema

Key tables (see `install.sql` for full schema):
- `pricing_plans` - Plans with `creem_product_id`, `billing_type` (recurring/onetime), prices, features
- `subscriptions` - User subscriptions with `creem_subscription_id`, status, period dates
- `purchases` - One-time purchases with `creem_order_id`, refund tracking
- `site_settings` - Key-value site configuration (super_admin only)
- `download_items` - `/download` 페이지 카드 (`github_url`, `file_path`, `youtube_url`, `is_paid`, `price`, `card_variant`)

### Server Actions Pattern

Each route that needs server mutations has a colocated `actions.ts` file:
- `app/admin/*/actions.ts` - Admin operations (users, pricing, subscriptions, etc.)
- `app/pricing/actions.ts` - Create checkout sessions
- `app/mypage/subscription/actions.ts` - User subscription management

### Component Organization

- `components/ui/` - shadcn/ui primitives (button, card, input, etc.)
- `components/admin/` - Admin page components (tables, forms, dialogs)
- `components/auth/` - Authentication forms (login, sign-up, password reset)
- `components/common/` - Shared components (navbar, auth-button, theme-switcher)
- `components/download/` - 다운로드 카드 + YouTube 썸네일 배지
- `components/landing/` - Landing page sections (hero, features, footer)
- `components/mypage/` - Mypage related components
- `components/pricing/` - Pricing page components
- `components/purchases/` - Purchase page components
- `components/subscription/` - Subscription management components
- `components/svgs/` - SVG logo components

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).

## Database Setup

Run `install.sql` in Supabase SQL Editor to create required tables. To set up the first super_admin:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-or-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-for-admin-operations>
CREEM_API_KEY=<creem-api-key>
CREEM_WEBHOOK_SECRET=<optional-webhook-signature-secret>
NEXT_PUBLIC_PORTONE_STORE_ID=<portone-store-id>
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=<portone-channel-key>  # 테스트/운영 채널 분기
PORTONE_API_SECRET=<portone-api-secret>
```

## shadcn/ui

Uses the "new-york" style with Zinc base color. Add components with:
```bash
npx shadcn@latest add <component-name>
```
