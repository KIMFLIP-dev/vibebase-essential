# VibeBase Essential

1인 창업용 SaaS 스타터킷. 회원가입부터 결제까지, SaaS에서 매번 다시 만드는
필수 기능이 미리 구현되어 있습니다.

## 기능

- **인증** — 이메일 가입(약관·마케팅 동의 기록) + 구글/카카오 소셜 로그인
- **결제** — PortOne V2 단건 결제 (서버 금액 고정 → 결제 → 검증 저장, 웹훅 서명 검증, 관리자 환불)
- **마이페이지** — 구매 내역(영수증), 1:1 문의, 프로필·아바타, 마케팅 동의 토글, 회원 탈퇴
- **블로그** — 마크다운 웹 에디터 + 공개 블로그 (`/blog`), 조회수, 태그
- **다운로드** — `/download` 카드 + 비공개 스토리지 signed URL
- **어드민** — 대시보드(매출 차트), 회원/상품/구매·환불/문의/블로그/다운로드/설정(공지 배너)
- **이메일** — Resend 기반 구매 영수증·환불·문의 답변 알림 (옵셔널)
- **SEO** — sitemap, robots, 블로그 OG 이미지 자동 생성, JSON-LD
- **기반** — env 부팅 검증(zod), GitHub Actions CI, Supabase CLI 마이그레이션

기술 스택: Next.js 15 (App Router) · Supabase · Tailwind CSS 4 · shadcn/ui · PortOne V2 · Resend

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 생성 + 스키마 설치

1. [Supabase Dashboard](https://database.new)에서 새 프로젝트 생성
2. SQL Editor에서 프로젝트 루트의 **`install.sql` 전체를 1회 실행**
   (테이블 8개 + Storage 버킷 3개 + RLS 정책이 설치됩니다)

또는 Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 3. 환경 변수

```bash
cp .env.example .env.local
```

`.env.example`의 안내에 따라 값을 채웁니다. 필수 키가 비어 있으면
`lib/env.ts`가 기동 시 어떤 키가 빠졌는지 알려줍니다.

| 키 | 발급처 |
|----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` 외 2종 | Supabase → Project Settings → API |
| `NEXT_PUBLIC_PORTONE_*`, `PORTONE_API_SECRET` | [PortOne 콘솔](https://admin.portone.io) → 결제 연동 |
| `PORTONE_WEBHOOK_SECRET` | PortOne 콘솔 → 개발자센터 → 웹훅 |
| `NEXT_PUBLIC_SITE_URL` | 서비스 도메인 (로컬: http://localhost:3000) |
| `RESEND_API_KEY`, `EMAIL_FROM` (선택) | [Resend](https://resend.com) — 도메인 인증 필요 |

### 4. 개발 서버

```bash
npm run dev
```

### 5. 첫 관리자 설정

**방법 A — 환경 변수 (권장, SQL 불필요)**

`.env.local`(또는 배포 환경 변수)에 본인 이메일을 지정합니다:

```
ADMIN_EMAIL=your-email@example.com
```

이 이메일로 **가입(또는 소셜 로그인)**하면 자동으로 super_admin이 부여됩니다.
역할이 없는 계정에만 1회 적용되므로 부여 확인 후에는 지워도 됩니다.
소셜 로그인은 즉시 반영되고, 이메일 가입은 확인 메일 완료 후 로그인하면 반영됩니다.

**방법 B — SQL 직접 실행**

가입 후 Supabase SQL Editor에서:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

> role은 반드시 `raw_app_meta_data`에 넣습니다. `raw_user_meta_data`는 사용자가
> 직접 수정할 수 있어 권한 저장소로 쓰면 안 됩니다.
> 실행 후 **로그아웃 → 재로그인**해야 반영됩니다. 이후 `/admin` 접속.

두 번째 관리자부터는 `/admin/users` → 회원 상세 → 역할 변경으로 지정합니다.

## PortOne 결제 설정

1. PortOne 콘솔에서 상점 생성 → 테스트 채널 추가 (기본: 카카오페이 EASY_PAY)
2. `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET` 설정
3. 웹훅 등록: 콘솔 → 개발자센터 → 웹훅 → `https://<도메인>/api/webhooks/portone`
   (V2, 발급된 시크릿을 `PORTONE_WEBHOOK_SECRET`에 설정)
4. **테스트 → 운영 전환**: 운영 PG 채널 추가 후 `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`만
   교체. 운영 채널에도 웹훅 URL 등록. Vercel은 `NEXT_PUBLIC_*`이 빌드에 인라인되므로
   **환경 변수 변경 후 재배포**해야 적용됩니다.

## 소셜 로그인 설정

### 0. Supabase URL 설정 (필수 — 빼먹으면 로그인 후 localhost로 튕깁니다)

Supabase Dashboard → **Authentication → URL Configuration**:

1. **Site URL**: 서비스 도메인 (예: `https://example.com`, 배포 전엔 `http://localhost:3000`)
2. **Redirect URLs**에 아래를 모두 추가:
   ```
   http://localhost:3000/**
   https://<배포 도메인>/**
   ```

이 앱은 소셜 로그인 시 `{현재 도메인}/auth/callback`으로, 가입 확인 메일은
`{현재 도메인}/mypage`로 돌아오도록 요청하는데, Supabase는 **Redirect URLs
허용 목록에 있는 주소로만 리다이렉트**해줍니다. 목록에 없으면 Site URL로
강제 이동되므로, 로컬·배포 도메인을 둘 다 등록해야 양쪽에서 정상 동작합니다.
(Vercel 프리뷰 배포도 쓰려면 `https://*-<team>.vercel.app/**` 추가)

### 1. 구글

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services →
   Credentials → OAuth 2.0 Client ID 생성 (동의 화면 미구성 시 먼저 구성)
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   (정확한 값은 Supabase → Authentication → Providers → Google 화면에 표시되는
   Callback URL을 복사하면 됩니다)
3. Supabase → **Authentication → Providers → Google** 활성화 + Client ID/Secret 입력 후 Save

### 2. 카카오

1. [Kakao Developers](https://developers.kakao.com)에서 앱 생성
2. 앱 설정 → 앱 키에서 **REST API 키** 확인 (= Supabase의 Client ID)
3. 제품 설정 → 카카오 로그인 → 보안에서 **Client Secret 발급 + 활성화**
4. 제품 설정 → 카카오 로그인 **활성화(ON)** + Redirect URI 등록:
   `https://<project-ref>.supabase.co/auth/v1/callback`
5. 동의항목 설정: profile_nickname, profile_image, account_email
   (이메일 수집은 비즈 앱 전환 필요, 개발 중엔 팀 관리에서 테스터 등록으로 테스트)
6. Supabase → **Authentication → Providers → Kakao** 활성화 + REST API 키/Client Secret 입력 후 Save

### 참고 — 이메일 가입 설정

- 이메일 확인 메일이 안 오면: Authentication → Providers → Email이 켜져 있는지,
  Supabase 기본 SMTP는 시간당 발송 제한이 있으므로 운영 시 Custom SMTP 연결 권장
- 개발 중 확인 메일 절차를 생략하려면: Authentication → Providers → Email →
  "Confirm email" 토글 OFF

## 배포 (Vercel)

1. 저장소를 GitHub에 푸시 후 Vercel에서 Import
2. 환경 변수 전체 등록 (`.env.example` 목록)
3. 배포 후 `NEXT_PUBLIC_SITE_URL`을 실제 도메인으로, PortOne 웹훅 URL도 도메인 기준으로 등록

셀프 호스팅(Docker 등)은 **빌드 환경과 런타임 환경 모두에 동일한 env를 제공**해야
합니다 (`NEXT_PUBLIC_*`은 빌드 타임 인라인 + 서버 기동 시 재검증).

## 프로젝트 구조

```
app/
├── auth/            로그인·가입(약관 동의)·비밀번호 재설정·콜백
├── products/        상품 목록/상세/체크아웃/결제 결과 + 결제 액션
├── blog/            블로그 목록/상세 (+OG 이미지 자동 생성)
├── download/        다운로드 카드
├── mypage/          구매 내역·1:1 문의·프로필(아바타·탈퇴)
├── admin/           대시보드·회원·상품·구매/환불·문의·블로그·다운로드·설정
└── api/webhooks/portone   PortOne 웹훅 (서명 검증)
lib/
├── supabase/        server/client/proxy 클라이언트
├── portone/         REST 클라이언트 + 웹훅 서명 검증
├── email/           Resend 발송 + React Email 템플릿
└── env.ts           환경 변수 부팅 검증 (zod)
install.sql          DB 스키마 전체 (supabase/migrations/0000_init.sql과 동일)
```

## 라이선스

MIT — 개인·상업 프로젝트에 자유롭게 사용하세요.
