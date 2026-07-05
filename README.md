<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js and Supabase Starter Kit</h1>
</a>

<p align="center">
 The fastest way to build apps with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Proxy
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Admin Dashboard Setup

이 프로젝트에는 관리자 대시보드가 포함되어 있습니다. 관리자 기능을 사용하려면 다음 단계를 따르세요.

### 1. 환경 변수 추가

`.env.local` 파일에 Service Role Key를 추가합니다:

```env
SUPABASE_SERVICE_ROLE_KEY=[INSERT SUPABASE SERVICE ROLE KEY]
```

> Service Role Key는 [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API에서 확인할 수 있습니다.

### 2. 첫 번째 관리자 설정

Supabase SQL Editor에서 다음 쿼리를 실행하여 관리자를 설정합니다:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

> `your-email@example.com`을 실제 관리자 이메일로 변경하세요.

### 3. 관리자 페이지 접속

관리자로 로그인한 후 `/admin` 경로로 접속하면 관리자 대시보드를 사용할 수 있습니다.

### 역할 종류

| 역할 | 설명 |
|-----|------|
| `user` | 일반 사용자 (기본값) |
| `admin` | 관리자 - 회원 조회/수정 가능 |
| `super_admin` | 최고 관리자 - 회원 삭제/역할 변경 가능 |

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)


### 소셜로그인 설정

 구글 OAuth 설정

 1. https://console.cloud.google.com 접속
 2. 프로젝트 생성 또는 선택
 3. APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
 4. Authorized redirect URI 추가:
   - https://<your-supabase-project>.supabase.co/auth/v1/callback
 5. Client ID, Client Secret 복사
 6. Supabase Dashboard > Authentication > Providers > Google
   - Client ID, Client Secret 입력
   - 활성화


⏺ 카카오톡 로그인 Supabase 설정 가이드

  1단계: 카카오 개발자 포털에서 앱 생성

  1. https://developers.kakao.com/ 접속 후 로그인
  2. 내 애플리케이션 → 애플리케이션 추가하기 클릭
  3. 앱 정보 입력 (앱 아이콘, 앱 이름, 회사명, 카테고리 등)

  2단계: REST API 키 확인 (Client ID)

  1. 앱 설정 → 앱 키 이동
  2. REST API 키 복사 → 이것이 Supabase의 Client ID

  3단계: Client Secret 생성

  1. 제품 설정 → 카카오 로그인 → 보안 이동
  2. Client Secret 코드 발급 클릭
  3. 활성화 상태를 사용함으로 변경
  4. 생성된 코드 복사 → 이것이 Supabase의 Client Secret

  4단계: 카카오 로그인 활성화

  1. 제품 설정 → 카카오 로그인 → 활성화 설정
  2. 상태를 ON으로 변경

  5단계: Redirect URI 설정

  1. 제품 설정 → 카카오 로그인 → Redirect URI
  2. 다음 URL 추가:
  https://<your-project-ref>.supabase.co/auth/v1/callback
  2. (Supabase 대시보드 → Authentication → Providers → Kakao에서 확인 가능)

  6단계: 동의 항목 설정

  1. 제품 설정 → 카카오 로그인 → 동의항목
  2. 다음 항목들 필수 동의 또는 선택 동의로 설정:
    - profile_nickname (닉네임)
    - profile_image (프로필 사진)
    - account_email (이메일) - 비즈 앱 전환 필요

  7단계: Supabase 대시보드 설정

  1. https://supabase.com/dashboard → 프로젝트 선택
  2. Authentication → Providers
  3. Kakao 토글 활성화
  4. 입력:
    - Client ID: REST API 키
    - Client Secret: 발급받은 시크릿 코드
  5. Save 클릭

  참고 사항

  - 이메일 수집: account_email 동의항목을 사용하려면 카카오 비즈니스 앱 전환이 필요합니다
  - 테스트: 개발 중에는 팀 관리에서 테스터를 추가해야 로그인 테스트 가능

  ---
  Sources:
  - https://supabase.com/docs/guides/auth/social-login/auth-kakao


  CREATE TABLE pricing_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER,
    currency TEXT DEFAULT 'KRW',
    features JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    creem_product_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Anyone can view active pricing plans"
    ON pricing_plans FOR SELECT USING (is_active = true);

  CREATE POLICY "Admins can view all pricing plans"
    ON pricing_plans FOR SELECT
    USING ((SELECT (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')));

  CREATE POLICY "Super admins can manage pricing plans"
    ON pricing_plans FOR ALL
    USING ((SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'));

      INSERT INTO pricing_plans (name, description, price_monthly, price_yearly, features, display_order, is_active, is_popular) VALUES
  (
    'Basic',
    '개인 사용자를 위한 기본 플랜',
    9900,
    99000,
    '["프로젝트 3개", "월 1,000회 API 호출", "기본 분석 리포트", "이메일 지원"]'::jsonb,
    1,
    true,
    false
  ),
  (
    'Pro',
    '성장하는 팀을 위한 인기 플랜',
    29900,
    299000,
    '["프로젝트 무제한", "월 50,000회 API 호출", "고급 분석 리포트", "우선 지원", "팀 협업 기능", "커스텀 도메인"]'::jsonb,
    2,
    true,
    true
  ),
  (
    'Enterprise',
    '대규모 조직을 위한 맞춤 플랜',
    99900,
    999000,
    '["모든 Pro 기능 포함", "무제한 API 호출", "전담 매니저", "SLA 보장", "온프레미스 설치", "커스텀 개발 지원"]'::jsonb,
    3,
    true,
    false
  );