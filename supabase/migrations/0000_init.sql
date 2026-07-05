-- =====================================================
-- VIBEBASE ESSENTIAL 설치 SQL
-- Supabase SQL Editor에서 1회 실행하세요.
-- (재실행 안전: IF NOT EXISTS + DROP POLICY IF EXISTS 패턴)
--
-- 구성: 테이블 8개 + Storage 버킷 3개 + RPC 2개
--   site_settings / products / pending_orders / product_purchases
--   posts / download_items / inquiries / user_consents
--   blog-images(공개) / avatars(공개) / download-files(비공개)
-- =====================================================

-- =====================================================
-- 0. 공통: updated_at 자동 갱신 트리거 함수
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. site_settings — 사이트 설정 key-value
-- =====================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'VIBEBASE ESSENTIAL'),
  ('announcement_enabled', 'false'),
  ('announcement_text', ''),
  ('announcement_link', '')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 주의: 이 테이블에 시크릿(API 키 등)을 저장하지 말 것.
-- 비로그인 노출은 공개 키 화이트리스트로 제한한다.
DROP POLICY IF EXISTS "site_settings_read_all" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_read_public" ON public.site_settings;
CREATE POLICY "site_settings_read_public" ON public.site_settings
  FOR SELECT USING (
    key IN ('site_name', 'announcement_enabled', 'announcement_text', 'announcement_link')
  );

DROP POLICY IF EXISTS "site_settings_read_admin" ON public.site_settings;
CREATE POLICY "site_settings_read_admin" ON public.site_settings
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "site_settings_update_super_admin" ON public.site_settings;
CREATE POLICY "site_settings_update_super_admin" ON public.site_settings
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "site_settings_insert_super_admin" ON public.site_settings;
CREATE POLICY "site_settings_insert_super_admin" ON public.site_settings
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "site_settings_service_role" ON public.site_settings;
CREATE POLICY "site_settings_service_role" ON public.site_settings
  FOR ALL TO service_role USING (true);

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. products — 범용 단건 판매 상품
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC DEFAULT NULL,          -- 정가 (할인 전, NULL이면 할인 없음)
  currency TEXT NOT NULL DEFAULT 'KRW',
  download_url TEXT,                            -- 구매 시 제공할 다운로드 링크 (옵션)
  is_published BOOLEAN DEFAULT false,
  is_coming_soon BOOLEAN DEFAULT false,         -- 준비중 (구매 버튼 숨김)
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published_order
  ON public.products(is_published, display_order);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_read_published" ON public.products;
CREATE POLICY "products_read_published" ON public.products
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "products_read_admin" ON public.products;
CREATE POLICY "products_read_admin" ON public.products
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "products_service_role" ON public.products;
CREATE POLICY "products_service_role" ON public.products
  FOR ALL TO service_role USING (true);

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. pending_orders — 결제 요청 전 금액 검증용 임시 주문
--    (서버에서 금액을 고정해 클라이언트 금액 변조를 차단)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,               -- 상점 주문번호 (서버 생성)
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KRW',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes')
);

CREATE INDEX IF NOT EXISTS idx_pending_orders_order_id ON public.pending_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_user_id ON public.pending_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON public.pending_orders(status);

ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pending_orders_read_own" ON public.pending_orders;
CREATE POLICY "pending_orders_read_own" ON public.pending_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pending_orders_service_role" ON public.pending_orders;
CREATE POLICY "pending_orders_service_role" ON public.pending_orders
  FOR ALL TO service_role USING (true);

DROP TRIGGER IF EXISTS update_pending_orders_updated_at ON public.pending_orders;
CREATE TRIGGER update_pending_orders_updated_at
  BEFORE UPDATE ON public.pending_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. product_purchases — 단건 구매 기록 (PortOne V2)
--    회원 탈퇴 시에도 거래 기록은 보존한다 (user_id만 NULL 처리,
--    전자상거래법 거래기록 보존 의무 대응. product_name은 구매 시점 스냅샷)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,                            -- 구매 시점 상품명 스냅샷

  order_id TEXT UNIQUE,                         -- 상점 주문번호 (pending_orders와 매칭)
  portone_payment_id TEXT UNIQUE,               -- PortOne paymentId (핵심 식별자)

  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'failed')),

  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KRW',
  payment_method TEXT,                          -- 카드, 간편결제 등
  receipt_url TEXT,                             -- PortOne 매출전표 URL

  is_refunded BOOLEAN DEFAULT false,
  refunded_amount NUMERIC DEFAULT 0,
  refunded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_purchases_user_id ON public.product_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_product_purchases_product_id ON public.product_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_product_purchases_user_product
  ON public.product_purchases(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_purchases_order_id ON public.product_purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_product_purchases_portone_payment_id
  ON public.product_purchases(portone_payment_id);
CREATE INDEX IF NOT EXISTS idx_product_purchases_status ON public.product_purchases(status);

ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_purchases_read_own" ON public.product_purchases;
CREATE POLICY "product_purchases_read_own" ON public.product_purchases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "product_purchases_read_admin" ON public.product_purchases;
CREATE POLICY "product_purchases_read_admin" ON public.product_purchases
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "product_purchases_service_role" ON public.product_purchases;
CREATE POLICY "product_purchases_service_role" ON public.product_purchases
  FOR ALL TO service_role USING (true);

DROP TRIGGER IF EXISTS update_product_purchases_updated_at ON public.product_purchases;
CREATE TRIGGER update_product_purchases_updated_at
  BEFORE UPDATE ON public.product_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. posts — 블로그 글 (/blog)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,                         -- 목록/OG 요약
  content_md TEXT NOT NULL DEFAULT '',  -- 본문 마크다운 원문
  cover_image_url TEXT,                 -- 커버 이미지 (공개 버킷 URL)
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  view_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,             -- 발행 시각 (정렬·노출 기준)
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 조회수 증가 RPC (비로그인 독자도 실행 가능)
CREATE OR REPLACE FUNCTION public.increment_post_view(p_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = p_id AND status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.increment_post_view(UUID) TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_posts_status_published
  ON public.posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts (slug);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_read_published" ON public.posts;
CREATE POLICY "posts_read_published" ON public.posts
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "posts_read_admin" ON public.posts;
CREATE POLICY "posts_read_admin" ON public.posts
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "posts_insert_admin" ON public.posts;
CREATE POLICY "posts_insert_admin" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "posts_update_admin" ON public.posts;
CREATE POLICY "posts_update_admin" ON public.posts
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "posts_delete_admin" ON public.posts;
CREATE POLICY "posts_delete_admin" ON public.posts
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "posts_service_role" ON public.posts;
CREATE POLICY "posts_service_role" ON public.posts
  FOR ALL TO service_role USING (true);

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. download_items — /download 페이지 다운로드 카드
-- =====================================================
CREATE TABLE IF NOT EXISTS public.download_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  badge_label TEXT DEFAULT '소스코드',
  github_url TEXT,
  file_path TEXT,
  file_name TEXT,
  youtube_url TEXT,
  is_paid BOOLEAN DEFAULT false,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'KRW',
  card_variant TEXT DEFAULT 'light',
  download_count INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.increment_download_count(p_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.download_items
  SET download_count = download_count + 1
  WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_download_count(UUID) TO service_role;

CREATE INDEX IF NOT EXISTS idx_download_items_published_order
  ON public.download_items (is_published, display_order);

ALTER TABLE public.download_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "download_items_read_published" ON public.download_items;
CREATE POLICY "download_items_read_published" ON public.download_items
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "download_items_read_admin" ON public.download_items;
CREATE POLICY "download_items_read_admin" ON public.download_items
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "download_items_insert_admin" ON public.download_items;
CREATE POLICY "download_items_insert_admin" ON public.download_items
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "download_items_update_admin" ON public.download_items;
CREATE POLICY "download_items_update_admin" ON public.download_items
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "download_items_delete_admin" ON public.download_items;
CREATE POLICY "download_items_delete_admin" ON public.download_items
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "download_items_service_role" ON public.download_items;
CREATE POLICY "download_items_service_role" ON public.download_items
  FOR ALL TO service_role USING (true);

DROP TRIGGER IF EXISTS update_download_items_updated_at ON public.download_items;
CREATE TRIGGER update_download_items_updated_at
  BEFORE UPDATE ON public.download_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. inquiries — 1:1 문의
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries_read_own" ON public.inquiries;
CREATE POLICY "inquiries_read_own" ON public.inquiries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "inquiries_insert_own" ON public.inquiries;
CREATE POLICY "inquiries_insert_own" ON public.inquiries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inquiries_read_admin" ON public.inquiries;
CREATE POLICY "inquiries_read_admin" ON public.inquiries
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "inquiries_update_admin" ON public.inquiries;
CREATE POLICY "inquiries_update_admin" ON public.inquiries
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "inquiries_service_role" ON public.inquiries;
CREATE POLICY "inquiries_service_role" ON public.inquiries
  FOR ALL TO service_role USING (true);

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. user_consents — 약관·마케팅 동의 기록 (법적 증빙)
--    가입 시 서버 액션(service_role)에서 기록한다.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_consents (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  privacy_agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  marketing_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_consents_read_own" ON public.user_consents;
CREATE POLICY "user_consents_read_own" ON public.user_consents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 마케팅 동의 토글은 서버 액션(service_role)으로만 처리한다.
-- (RLS는 컬럼 단위 제한이 불가 — 본인 UPDATE를 열면 필수 동의 일시
--  terms_agreed_at/privacy_agreed_at까지 조작 가능해 법적 증빙이 훼손된다)
DROP POLICY IF EXISTS "user_consents_update_own" ON public.user_consents;

DROP POLICY IF EXISTS "user_consents_read_admin" ON public.user_consents;
CREATE POLICY "user_consents_read_admin" ON public.user_consents
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "user_consents_service_role" ON public.user_consents;
CREATE POLICY "user_consents_service_role" ON public.user_consents
  FOR ALL TO service_role USING (true);

DROP TRIGGER IF EXISTS update_user_consents_updated_at ON public.user_consents;
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. Storage 버킷
--    blog-images / avatars: 공개 (URL 직접 접근)
--    download-files: 비공개 (service_role이 signed URL 발급)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('download-files', 'download-files', false)
ON CONFLICT (id) DO NOTHING;

-- 업로드/삭제는 모두 서버 액션(service_role)을 통하므로
-- 사용자용 Storage RLS 정책은 별도로 두지 않는다.

-- =====================================================
-- 10. 시드 데이터 — 데모 상품 1건
-- =====================================================
INSERT INTO public.products (
  name, slug, short_description, description, price, currency,
  is_published, display_order
)
SELECT
  '바이브베이스 에센셜 스타터',
  'vibebase-essential-starter',
  '회원가입·로그인·마이페이지·단건 결제·블로그가 포함된 SaaS 스타터.',
  '데모용 샘플 상품입니다. 어드민 → 상품 관리에서 수정하거나 삭제하세요.',
  10000,
  'KRW',
  true,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.products WHERE slug = 'vibebase-essential-starter'
);

-- =====================================================
-- 11. 첫 번째 관리자 설정 (이메일을 본인 것으로 바꿔서 실행)
--
-- 주의: role은 반드시 app_metadata(raw_app_meta_data)에 저장한다.
-- user_metadata는 사용자가 updateUser()로 직접 수정할 수 있어
-- 권한 판별에 쓰면 누구나 스스로 관리자로 승격할 수 있다.
-- =====================================================
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
-- WHERE email = 'your-email@example.com';
--
-- 실행 후 반드시 로그아웃 → 재로그인해야 역할이 반영됩니다.
