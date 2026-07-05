# VIBEBASE ESSENTIAL 구축 계획

> 원본: `../vibabase-creem-app` (origin/main `e802828` 기준, 블로그 포함)
> 목표: 어떤 SaaS든 바로 시작할 수 있는 **essential 배포 소스** 신규 구성
> 작성일: 2026-07-05

---

## 1. 목표

`vibabase-creem-app`에서 검증된 코드 중 **SaaS의 필수 기능만** 추려서,
이 폴더(`vibebase-essential`)에 깔끔한 배포용 소스를 새로 만든다.

- 회원가입 / 로그인 (이메일 + 구글/카카오 소셜, 약관·마케팅 동의 포함)
- 마이페이지 (프로필·아바타, 비밀번호, 구매 내역, 1:1 문의, 회원 탈퇴)
- **PortOne V2 단건 결제** (구독 결제 제외, 범용 상품 모델로 일반화, 웹훅 서명 검증, 영수증 링크)
- 블로그 (DB + 마크다운 웹 에디터) + SEO 패키지 (sitemap / robots / OG / JSON-LD)
- 다운로드 카드 (`/download`)
- 어드민 (회원, 상품, 구매내역, 블로그, 다운로드, 문의, 설정, 통계 대시보드, 공지 배너)
- 트랜잭셔널 이메일 (Resend — 구매 영수증/환불 알림, 옵셔널)
- 개발 기반: env 부팅 검증, GitHub Actions CI, Supabase CLI 마이그레이션 체계
- 불필요한 DB 테이블/코드/파일 완전 정리

## 2. 확정된 결정사항

| 항목 | 결정 |
|------|------|
| 블로그 | 원본 main 최신 커밋의 DB 기반 블로그(`posts` + `@uiw/react-md-editor`)를 **그대로 이관** |
| 결제 모듈 | **PortOne 단건만**. Creem 코드/테이블/의존성 전부 제거 |
| 상품 모델 | 강의(courses/chapters/lessons) 전용 구조 제거 → **범용 `products`로 일반화** |
| 부가 기능 | **어드민 대시보드 통계** + **다운로드 카드** 포함. fumadocs 문서(/docs)는 제외 |
| 구독 결제 | 제외 확정 (`subscriptions`, `pricing_plans`, `transactions` 등 삭제) |
| 확장팩 | 추가 제안 15개 중 **12번(Playwright 스모크 테스트)만 제외**하고 전부 채택 → §4-4 |
| 웹훅 매칭 | `customData.orderId` 정확 매칭으로 개선 확정 (금액 일치 fallback 제거) → Phase 3-5 |

## 3. 원본 분석 요약

### 기술 스택 (유지)
- Next.js 15+ App Router, React 19, TypeScript
- Supabase: Auth(이메일+소셜) / Postgres(RLS) / Storage
- Tailwind CSS 4 + shadcn/ui (new-york, Zinc) + next-themes + sonner
- 결제: PortOne V2 (browser SDK + REST API)
- 차트: recharts

### 원본의 핵심 아키텍처 패턴 (그대로 계승)
- `lib/supabase/` 4-클라이언트 구조: `server.ts`(+`createAdminClient`), `client.ts`, `proxy.ts`(세션 갱신+라우트 보호), `admin.ts`
- 역할 시스템: `user` / `admin` / `super_admin`
  - **[보안 수정 — Phase 2 리뷰 반영]** 원본은 role을 `user_metadata`에 저장했으나, user_metadata는 사용자가 `updateUser()`로 직접 수정 가능해 **누구나 스스로 관리자 승격이 가능한 권한 상승 취약점**이었다. essential은 role을 `app_metadata`(admin API로만 변경 가능)로 이전 — RLS 정책·미들웨어·헬퍼 전부 `auth.jwt() -> 'app_metadata' ->> 'role'` 기준.
  - 미들웨어에서 `/admin/*` 보호, `lib/admin/auth.ts`의 `isAdmin()`/`requireAdmin()` 헬퍼
- 라우트별 colocated `actions.ts` (Server Actions)
- 결제 검증 3단계: `pending_orders` 생성(서버, 금액 고정) → 위젯 결제 → `confirmAndSavePurchase`(PortOne API로 상태·금액 검증 후 저장) + 웹훅 fallback
- 모든 테이블 RLS + `update_updated_at_column()` 트리거

### 원본에서 발견한 정리 대상 (essential에 가져가지 않음)
- 미사용/백업 코드: `app/_backup/`, `app/notes/`(테스트 페이지), `components/landing_old/`, `components/common/`(구버전 — 실사용은 `common_new`), `components/mypage/`(starter kit 튜토리얼 잔재: tutorial-step, fetch-data-steps, code-block)
- 잡파일: `code.html`(5.9MB), `sample-design.html`, `.env copy.local`, `.env copy 2.local`, `tsconfig.tsbuildinfo`, `seed-*.sql`(강의 시드), `plan-download.md`, `plan-blog.md`, `PLAN.md`(구버전)
- 유산 네이밍: `course_purchases.toss_order_id` / `toss_payment_key` (토스→포트원 전환 흔적)

## 4. 기능 범위

### 4-1. 그대로 가져오기 (경로만 정리)

| 기능 | 원본 경로 | 비고 |
|------|----------|------|
| 인증 페이지 | `app/auth/*` (login, sign-up, sign-up-success, forgot-password, update-password, callback, confirm, error) | 전체 유지 |
| 인증 폼 | `components/auth/*` (소셜 로그인 버튼 포함) | 전체 유지 |
| Supabase 클라이언트 | `lib/supabase/*` 4종 | 유지. proxy 화이트리스트만 수정 |
| 역할 헬퍼 | `lib/admin/auth.ts`, `lib/auth/redirect.ts` | 유지 |
| PortOne 클라이언트 | `lib/portone/client.ts` | 그대로 |
| 블로그 | `app/blog/*`, `app/admin/posts/*`, `components/blog/*`, `components/admin/post-form.tsx`, `posts-table.tsx`, `lib/types/post.ts` | 그대로 |
| 다운로드 | `app/download/*`, `app/api/downloads/[id]/file/`, `components/download/*`, `lib/youtube.ts` | 그대로 (유료 카드는 UI만, 결제 연동은 원본처럼 TODO) |
| 마이페이지 | `app/mypage/` (page, layout, profile, password, purchases) | `courses`, `subscription` 제거 |
| 어드민 공통 | `app/admin/layout.tsx`, `admin-sidebar`, `admin-header`, users, settings | 사이드바 메뉴 재구성 |
| 공통 UI | `components/ui/*`, `components/common_new/*`(navbar/mobile-nav/user-menu/auth-button), `components/svgs/*`, 테마 스위처 | `common_new` → `common`으로 이름 정리 |
| 법적 고지 | `app/legal/*` (terms, privacy) | 유지 |
| 랜딩 | `app/page.tsx` + `components/landing/*` | 강의 판매용 섹션(curriculum, community)은 범용 SaaS 카피로 교체 |

### 4-2. 일반화 (강의 전용 → 범용 상품)

**원본의 PortOne 결제 흐름을 `courses` 의존에서 떼어내 `products`로 재작성한다.**

| 원본 | Essential |
|------|-----------|
| `courses` 테이블 (chapters/lessons/Vimeo 포함) | `products` 테이블 (단일 테이블, 콘텐츠 구조 없음) |
| `course_purchases` | `product_purchases` (칼럼명 정리: `toss_order_id`→`order_id`, `toss_payment_key`→`portone_payment_id`) |
| `pending_orders.course_id` | `pending_orders.product_id` |
| `app/courses/actions.ts`의 `createPendingOrder`, `confirmAndSavePurchase` | `app/products/actions.ts`로 이동·일반화 (검증 로직 동일) |
| `app/courses/[slug]/checkout` + success/fail | `app/products/[slug]/checkout` + success/fail |
| `components/courses/portone-payment-widget.tsx` | `components/products/portone-payment-widget.tsx` (카카오페이 EASY_PAY 유지) |
| `app/api/webhooks/portone/route.ts` | 동일 로직, `product_purchases` 기반으로 수정 |
| `app/admin/courses`, `app/admin/course-purchases` | `app/admin/products`(CRUD 단순화), `app/admin/purchases`(구매내역+환불 처리) |
| `app/mypage/courses` (내 강좌) | `app/mypage/purchases` (구매 내역)로 통합 |

- 구매 완료 후 제공물은 앱마다 다르므로, essential은 `product_purchases`에 "구매 완료" 상태까지만 책임진다.
  `products.download_url`(옵션)로 구매 시 다운로드 제공 예시 1개만 구현 → 확장 포인트로 문서화.
- 어드민 환불은 원본 `cancelPayment()`(PortOne 취소 API) 흐름을 products 기준으로 이식.

### 4-3. 완전 제거

| 대상 | 상세 |
|------|------|
| Creem 전체 | `lib/creem/`, `app/api/webhooks/creem/`, `app/portal/`, `app/pricing/`, `app/purchases/`(Creem 단건 페이지), `app/mypage/subscription/`, `components/pricing/`, `components/purchases/`, `components/subscription/`, `app/admin/pricing`, `app/admin/subscriptions`, `app/admin/transactions`, 의존성 `@creem_io/nextjs` |
| 구독/플랜 DB | `pricing_plans`, `subscriptions`, `purchases`(Creem), `transactions` 테이블 |
| 강의 시스템 | `app/courses/`, `app/admin/courses/`, `app/admin/course-purchases/`, `app/api/courses/`, `components/courses/`(결제 위젯 제외), `lib/vimeo/`, `lib/types/course.ts`, DB: `courses`/`chapters`/`lessons`/`course_purchases`, Storage `source-codes` 버킷 |
| fumadocs | `app/docs/`, `content/`, `lib/source.ts`, `source.config.ts`, `.source/`, 의존성 `fumadocs-core/mdx/ui` |
| 잔재 | 3-3에서 나열한 미사용 코드·잡파일 전부 |

### 4-4. 신규 구축 (원본에 없음 — 확장팩 채택분)

| # | 항목 | 내용 | 반영 |
|---|------|------|------|
| 1 | 웹훅 서명 검증 | PortOne V2 `Webhook-Signature` 검증, 실패 시 401 (현재 원본은 무검증) | Phase 3 |
| 2 | env 부팅 검증 | zod 기반 `lib/env.ts` — 필수 키 누락을 명확한 에러로 | Phase 0 |
| 3 | pending_orders 만료 처리 | `expires_at` 지난 주문은 결제 검증 거부 + 정리 | Phase 3 |
| 4 | 회원 탈퇴 | mypage 셀프 탈퇴. 구매기록은 `user_id` NULL(기존 FK 동작)로 보존, 계정은 삭제 | Phase 4 |
| 5 | 약관·마케팅 동의 | 가입 폼 필수/선택 체크 + `user_consents` 테이블에 동의 일시 저장 (법적 증빙) | Phase 4 |
| 6 | 트랜잭셔널 이메일 | Resend + React Email — 구매 영수증/환불 알림. env 없으면 스킵(옵셔널) | Phase 7 |
| 7 | SEO 패키지 | `sitemap.ts`, `robots.ts`, 블로그 OG 이미지 자동 생성(`next/og`), JSON-LD | Phase 6 |
| 8 | 1:1 문의 | `inquiries` 테이블 — mypage 작성/조회 + 어드민 답변 | Phase 4·5 |
| 9 | 공지 배너 | `site_settings` 기반 상단 배너, 어드민 설정에서 on/off·문구 관리 | Phase 8 |
| 10 | GitHub Actions CI | lint + `tsc --noEmit` + build | Phase 0 |
| 11 | Supabase 마이그레이션 | `supabase/migrations/` 구조를 `install.sql`과 병행 제공 | Phase 0·2 |
| 13 | 프로필 아바타 | `avatars` 공개 버킷 + 프로필 페이지 업로드 | Phase 4 |
| 14 | 다크모드 정합성 | 하드코딩 색상(`#F9F9FB`, `#111` 등) → 시맨틱 토큰 치환, 테마 스위처 유지 | Phase 8 |
| 15 | 결제 영수증 링크 | `product_purchases.receipt_url` 저장 + 구매내역에 노출 | Phase 3 |

> 12번(Playwright 스모크 테스트)은 제외 확정.

## 5. DB 스키마 (`install.sql` 신규 작성)

essential용 `install.sql` 하나로 전체 설치 가능하게 재작성. **테이블 8개 + 버킷 3개**
(원본 install.sql은 테이블 11개 + 버킷 3개 — 구독/강의 계열을 걷어내고 문의·동의를 추가).
동일 내용을 `supabase/migrations/0000_init.sql`로도 제공해 CLI(`supabase db push`) 경로 병행.

```
공통
├─ update_updated_at_column()  트리거 함수 (모든 테이블 적용)
│
테이블
├─ site_settings        사이트 설정 key-value (원본 그대로)
├─ products             범용 상품 [신규 설계]
│    id, name, slug(unique), description, short_description,
│    thumbnail_url, price, original_price, currency('KRW'),
│    download_url, is_published, is_coming_soon, display_order,
│    created_at, updated_at
├─ pending_orders       결제 전 금액 검증용 (원본에서 course_id → product_id)
│    order_id(unique), user_id, product_id, amount, currency,
│    status(pending|completed|expired), expires_at(30분)
├─ product_purchases    단건 구매 기록 (course_purchases 개명+칼럼 정리)
│    user_id, product_id, order_id(unique), portone_payment_id(unique),
│    status(completed|refunded|failed), amount, currency, payment_method,
│    receipt_url, is_refunded, refunded_amount, refunded_at
├─ posts                블로그 글 (blog-schema.sql 그대로)
│    + increment_post_view() RPC (anon 실행 가능)
├─ download_items       다운로드 카드 (원본 그대로)
│    + increment_download_count() RPC (service_role)
├─ inquiries            1:1 문의 [신규]
│    user_id, title, message, status(open|answered|closed),
│    answer, answered_at, created_at, updated_at
└─ user_consents        약관·마케팅 동의 기록 [신규]
     user_id(unique), terms_agreed_at, privacy_agreed_at,
     marketing_opt_in, marketing_updated_at

Storage 버킷
├─ blog-images     공개
├─ avatars         공개 (프로필 이미지) [신규]
└─ download-files  비공개 (signed URL 5분)
```

RLS 원칙 (원본 패턴 유지):
- 공개 리소스(published products/posts/download_items): 누구나 SELECT
- 본인 데이터(pending_orders, product_purchases, inquiries, user_consents): `auth.uid() = user_id` SELECT (문의는 본인 INSERT 허용, 마케팅 동의는 본인 UPDATE 허용)
- 어드민: `auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin','super_admin')`
- 쓰기(결제 저장, 가입 시 동의 기록 등): service_role 전용

시드: 데모 상품 1건 + `site_settings.site_name` + 첫 super_admin 설정 SQL 주석 안내.

## 6. 라우트 구조

```
/                         랜딩 (공개)
/auth/*                   로그인·가입·비번 재설정 (공개)
/blog, /blog/[slug]       블로그 (공개)
/products                 상품 목록 (공개)
/products/[slug]          상품 상세 (공개)
/products/[slug]/checkout 결제 (로그인 필요)
/products/success|fail    결제 결과
/download                 다운로드 카드 (공개)
/legal/terms|privacy      약관 (공개)
/mypage                   마이페이지 허브
/mypage/profile           회원정보 수정 + 아바타 업로드 + 마케팅 동의 토글 + 회원 탈퇴
/mypage/password          비밀번호 변경
/mypage/purchases         구매 내역 (영수증 링크 포함)
/mypage/inquiries[/new]   1:1 문의 목록·작성
/admin                    → /admin/dashboard 리다이렉트
/admin/dashboard          통계 (가입자 + 매출/구매 추이)
/admin/users[/[id]]       회원 관리
/admin/products[/...]     상품 CRUD
/admin/purchases          구매내역 + 환불 처리
/admin/posts[/...]        블로그 CRUD
/admin/downloads[/...]    다운로드 CRUD
/admin/inquiries[/[id]]   문의 답변
/admin/settings           사이트 설정 + 공지 배너 관리 (super_admin)
/api/webhooks/portone     PortOne 웹훅 (서명 검증)
/api/downloads/[id]/file  파일 다운로드 (signed URL)
/sitemap.xml, /robots.txt SEO (블로그 글·상품 포함 동적 생성)
/blog/[slug]/opengraph-image  블로그 OG 이미지 자동 생성
```

`lib/supabase/proxy.ts` 공개 화이트리스트: `/`, `/auth`, `/blog`, `/products`, `/download`, `/api/downloads`, `/legal` (checkout은 로그인 필수 유지).

## 7. 작업 단계

### Phase 0 — 부트스트랩
1. 원본을 이 폴더로 복사하되 제외: `.git`, `node_modules`, `.next`, `.source`, 3-3 정리 대상 파일 전부
2. `git init` + 새 `.gitignore` (env 파일, `.next`, `node_modules`, `*.tsbuildinfo`)
3. `package.json` 정리: `@creem_io/nextjs`, `fumadocs-*` 제거 / PortOne·블로그(md-editor, react-markdown 계열, typography)·recharts 유지 / `resend`, `@react-email/components`, `zod` 추가 / 프로젝트명 `vibebase-essential`
4. `.env.example` 재작성 (8절 참고), `npm install` → 빌드 시도(깨진 import 목록 확보)
5. **env 부팅 검증**: `lib/env.ts` — zod 스키마로 필수 env 검증, 서버 기동 시 누락 키를 명확한 에러 메시지로 (옵셔널 키는 명시 구분)
6. **GitHub Actions CI**: `.github/workflows/ci.yml` — lint + `tsc --noEmit` + build
7. **Supabase CLI 구조**: `supabase/` 초기화, 마이그레이션 디렉토리 컨벤션 확립

### Phase 1 — 제거 수술
1. 4-3 목록의 디렉토리/파일 삭제
2. navbar(`common_new` → `common` 개명), admin-sidebar, footer, mypage 허브에서 삭제된 메뉴 정리
3. `npx tsc --noEmit`으로 잔여 참조 제거 확인

### Phase 2 — DB 스키마
1. 5절 설계대로 `install.sql` 신규 작성 (재실행 안전: `IF NOT EXISTS` + `DROP POLICY IF EXISTS`)
2. 동일 내용을 `supabase/migrations/0000_init.sql`로 제공 (이후 스키마 변경은 마이그레이션 파일 추가 컨벤션)
3. `lib/types/` 정리: `product.ts`·`inquiry.ts` 신규, `payment.ts`(PortOne 타입) 유지, `course.ts` 삭제, `admin.ts`에서 구독 타입 제거

### Phase 3 — 결제 일반화 (핵심)
1. `app/products/actions.ts`: `getPublishedProducts`, `getProductBySlug`, `hasUserPurchasedProduct`, `createPendingOrder`, `confirmAndSavePurchase`, `getUserPurchases` (원본 courses/actions.ts 이식)
2. `app/products/` 페이지: 목록·상세·checkout·success·fail (원본 courses 페이지에서 커리큘럼/레슨 UI 제거)
3. `components/products/portone-payment-widget.tsx` 이식
4. 웹훅 `app/api/webhooks/portone/route.ts`: `product_purchases` + 새 칼럼명 기준 수정
5. **웹훅 주문 매칭 개선(확정)**: 결제 요청 시 `customData`에 `orderId`를 담고, 웹훅에서 `payment.customData.orderId`로 `pending_orders`를 정확히 조회. 원본의 "pending 중 금액 일치" fallback은 제거(동일 금액 동시 주문 오매칭 방지). `confirmAndSavePurchase`의 금액 검증은 그대로 유지
6. **웹훅 서명 검증**: `Webhook-Signature` 헤더 검증 (`PORTONE_WEBHOOK_SECRET`), 실패 시 401 — 위조 웹훅 차단
7. **pending_orders 만료 처리**: `confirmAndSavePurchase`·웹훅에서 `expires_at` 지난 주문 거부(`expired` 처리), 조회 쿼리에 만료 필터
8. **영수증 링크**: PortOne 응답의 `receiptUrl`을 `product_purchases.receipt_url`에 저장
9. orderId 프리픽스 `COURSE_` → `ORDER_`

### Phase 4 — 계정·마이페이지
1. **가입 약관 동의**: sign-up 폼에 이용약관/개인정보(필수)·마케팅 수신(선택) 체크박스, `/legal` 링크 연결. 가입 서버 액션에서 `user_consents`에 동의 일시 저장(service_role)
2. 허브 메뉴: 구매 내역 / 1:1 문의 / 회원정보 수정 / 비밀번호 변경
3. `/mypage/purchases`를 `product_purchases` 기반으로 재작성 (구매일·상품명·금액·환불 상태·영수증 링크, download_url 있으면 다운로드 버튼)
4. **1:1 문의**: `/mypage/inquiries` 목록 + `/mypage/inquiries/new` 작성 (답변 오면 상태 표시)
5. **프로필 아바타**: `avatars` 버킷 업로드 + `user_metadata.avatar_url` 저장, navbar 유저 메뉴에 반영
6. **마케팅 동의 토글**: 프로필 페이지에서 `user_consents.marketing_opt_in` 변경
7. **회원 탈퇴**: 프로필 하단 탈퇴 섹션 — 확인 다이얼로그 → 서버 액션에서 `auth.admin.deleteUser()`. 구매기록은 FK `ON DELETE SET NULL`로 보존, 문의·동의 기록은 함께 삭제(CASCADE)

### Phase 5 — 어드민
1. 사이드바: 대시보드 / 회원 / 상품 / 구매내역 / 블로그 / 다운로드 / 문의 / 설정
2. `admin/products` CRUD: 원본 course-form에서 챕터 에디터 제거한 단순 폼
3. `admin/purchases`: 원본 course-purchases 테이블 이식 + PortOne 환불(`cancelPayment`) 액션
4. 대시보드: 가입자 통계(`getDashboardStats`) 유지, 구독 차트 → **product_purchases 기반 매출/구매 추이 차트**로 교체
5. **`admin/inquiries`**: 문의 목록(상태 필터) + 답변 작성 → `answered` 상태 전환 (답변 시 알림 메일은 Phase 7에서 연결)

### Phase 6 — 블로그·다운로드·SEO
1. 블로그 파일 전체 이식 + `app/globals.css`의 typography 설정 확인
2. 다운로드 파일 전체 이식 (유료 결제 연동은 원본과 동일하게 TODO로 남김)
3. **SEO 패키지**: `app/sitemap.ts`(블로그 글·상품 동적 포함), `app/robots.ts`, 블로그 `opengraph-image.tsx`(`next/og`로 제목 기반 자동 생성), 블로그 상세 JSON-LD(Article), 루트 metadata 정리 (`NEXT_PUBLIC_SITE_URL` 기반 절대 URL)

### Phase 7 — 트랜잭셔널 이메일 (Resend)
1. `lib/email/`: Resend 클라이언트 + React Email 템플릿 (구매 영수증, 환불 알림, 문의 답변 알림)
2. 발송 지점 연결: `confirmAndSavePurchase` 성공 시 영수증, 어드민 환불 시 환불 알림, 문의 답변 시 알림
3. **옵셔널 구조**: `RESEND_API_KEY` 미설정이면 발송 스킵 + 로그만 남김 (템플릿 사용자가 이메일 없이도 구동 가능)

### Phase 8 — 랜딩·공지 배너·다크모드·마무리
1. 랜딩: hero/features/faq/cta는 범용 SaaS 카피로 수정, curriculum·community 섹션은 제거하거나 범용 섹션으로 교체
2. **공지 배너**: `site_settings`(`announcement_enabled`, `announcement_text`, `announcement_link`) 기반 공통 레이아웃 상단 배너, 어드민 설정에서 관리
3. **다크모드 정합성**: 랜딩·mypage 등의 하드코딩 색상(`#F9F9FB`, `#111`, `bg-white` 등)을 시맨틱 토큰(`bg-background`, `text-foreground`, `border-border` 등)으로 치환, 테마 스위처 유지 — 전 페이지 다크모드 육안 점검
4. CLAUDE.md / README.md 신규 작성 (설치·환경변수·PortOne 채널 전환 가이드·첫 admin 설정·Resend 도메인 인증)
5. `npm run build` + lint 통과 (CI 그린 확인)
6. 신규 Supabase 프로젝트에 `install.sql` 실행 → 수동 검증: 가입(동의 포함)→로그인→상품 구매(테스트 채널)→영수증 메일→마이페이지 확인→어드민 환불→문의 작성/답변→블로그 발행→다운로드→탈퇴

## 8. 환경 변수 (`.env.example`)

```
# 필수 (lib/env.ts에서 부팅 시 검증)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PORTONE_STORE_ID=
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=   # 테스트/운영은 채널 키 교체로 전환
PORTONE_API_SECRET=
PORTONE_WEBHOOK_SECRET=            # 웹훅 서명 검증 (PortOne 콘솔에서 발급)
NEXT_PUBLIC_SITE_URL=              # SEO/OG 절대 URL (예: https://example.com)

# 옵셔널 (없으면 이메일 발송 스킵)
RESEND_API_KEY=
EMAIL_FROM=                        # 예: no-reply@example.com (Resend 도메인 인증 필요)
```
(Creem 관련 4종 제거)

## 9. 검증 체크리스트

- [ ] `npm run build` 성공, `tsc --noEmit` 클린, CI 그린
- [ ] 소스 내 `creem`, `course`, `vimeo`, `fumadocs`, `toss` 문자열 0건 (grep 확인)
- [ ] 신규 Supabase에 `install.sql` 1회 실행으로 전체 설치 완료 (`supabase db push` 경로도 확인)
- [ ] 필수 env 하나 빼고 기동 → `lib/env.ts`가 명확한 에러로 알려주는지
- [ ] 이메일 가입(필수 약관 미체크 시 차단) → 확인 메일 → 로그인 → 마이페이지, `user_consents` 기록 확인
- [ ] 소셜 로그인 (구글/카카오) 콜백 정상
- [ ] super_admin 설정 후 `/admin` 접근, 일반 유저는 차단
- [ ] PortOne 테스트 채널로 상품 결제 → `product_purchases` 저장(+`receipt_url`) → 웹훅 수신(customData.orderId 매칭)
- [ ] 금액 변조 시나리오(다른 금액 결제) 거부 확인
- [ ] 서명 없는/틀린 웹훅 요청 → 401 거부
- [ ] 만료된 pending_order로 결제 검증 시도 → 거부
- [ ] 구매 영수증 메일 수신 (RESEND_API_KEY 없으면 스킵 로그만 남는지도 확인)
- [ ] 어드민 환불 → 상태 `refunded` 반영 + 환불 알림 메일
- [ ] 1:1 문의 작성 → 어드민 답변 → 상태 `answered` + 알림 메일
- [ ] 프로필 아바타 업로드 → navbar 반영, 마케팅 동의 토글 저장
- [ ] 회원 탈퇴 → 로그인 불가, 구매기록 보존(user_id NULL), 문의·동의 삭제
- [ ] 블로그 작성(이미지 업로드)→발행→비로그인 열람+조회수 증가
- [ ] `/sitemap.xml`, `/robots.txt`, 블로그 OG 이미지 응답 확인
- [ ] 다운로드 카드 signed URL 다운로드 + 카운트 증가
- [ ] 공지 배너 on/off·문구 변경 반영
- [ ] 전 페이지 다크모드 육안 점검 (하드코딩 색상 잔재 없음)

## 10. 리스크 / 참고

- ~~**웹훅 주문 매칭**: 원본 웹훅은 paymentId↔orderId 직접 매칭이 없어 "pending 중 금액 일치" fallback을 쓴다.~~ → **Phase 3-5로 반영 확정** (customData.orderId 정확 매칭).
- **`NEXT_PUBLIC_*` 빌드 인라인**: Vercel에서 PortOne 채널 키 변경 시 재배포 필요 (원본 CLAUDE.md 지침 계승).
- 원본의 `install.sql`에는 RLS 정책 재실행 충돌 이슈가 있었음 → essential은 전 정책 `DROP POLICY IF EXISTS` 패턴으로 통일.
- 랜딩 카피는 강의 판매용이라 essential 데모용 범용 카피 작성 필요 (Phase 8에서 별도 확인).
- **PORTONE_WEBHOOK_SECRET**: PortOne 콘솔 → 웹훅 설정에서 발급. 테스트/운영 채널별로 다를 수 있으니 README에 명시.
- **Resend**: 발신 도메인 인증(DNS 레코드) 없이는 발송 불가 — 옵셔널 구조라 미설정이어도 앱은 정상 구동. README에 설정 가이드 포함.
- **회원 탈퇴와 전자상거래법**: 거래기록 보존 의무(5년)가 있어 구매 레코드는 삭제하지 않고 `user_id`만 NULL 처리(이메일 등 개인정보는 auth.users 삭제로 함께 소멸). 보존 항목이 더 필요하면 앱별로 확장.
- **다크모드 치환 범위**: 랜딩·블로그·mypage 전반에 하드코딩 색상이 많아 Phase 8 작업량이 큼. 페이지 단위로 나눠 진행하고 육안 점검 필수.
