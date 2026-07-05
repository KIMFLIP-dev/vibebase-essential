import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getProductBySlug,
  hasUserPurchasedProduct,
} from "@/app/products/actions";
import { NavbarNew } from "@/components/common/navbar";
import { FooterNew } from "@/components/landing/footer";
import { ArrowLeft, CheckCircle, Package, Download } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).normalize("NFC");
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "상품을 찾을 수 없습니다" };
  }

  return {
    title: product.name,
    description: product.short_description || product.description || undefined,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).normalize("NFC");

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const purchased = user ? await hasUserPurchasedProduct(product.id) : false;

  const hasDiscount =
    product.original_price != null &&
    product.original_price > product.price &&
    product.price > 0;

  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.original_price!) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-bold text-[#111] hover:text-[#B7B2FF] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            상품 목록으로
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 썸네일 */}
            <div className="aspect-video md:aspect-square bg-white rounded-2xl border border-[#111] overflow-hidden">
              {product.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-[#B7B2FF]" />
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-[#111]">
                {product.name}
              </h1>
              {product.short_description && (
                <p className="text-gray-500 mt-3">
                  {product.short_description}
                </p>
              )}

              {/* 가격 */}
              <div className="mt-6">
                {product.is_coming_soon ? (
                  <span className="inline-block text-sm font-bold text-[#111] bg-[#7FFF00]/70 rounded-full px-3 py-1.5">
                    곧 출시됩니다
                  </span>
                ) : product.price <= 0 ? (
                  <span className="text-3xl font-black text-[#111]">무료</span>
                ) : (
                  <div className="flex items-center gap-3">
                    {hasDiscount && (
                      <>
                        <span className="text-lg text-gray-400 line-through">
                          ₩{product.original_price!.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#B7B2FF] text-white">
                          {discountPercent}%
                        </span>
                      </>
                    )}
                    <span className="text-3xl font-black text-[#111]">
                      ₩{product.price.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* 구매 버튼 */}
              <div className="mt-8">
                {purchased ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <CheckCircle className="w-5 h-5" />
                      구매한 상품입니다
                    </div>
                    {product.download_url && (
                      <a
                        href={product.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#111] text-white font-bold text-sm hover:bg-[#B7B2FF] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        다운로드
                      </a>
                    )}
                  </div>
                ) : product.is_coming_soon ? (
                  <button
                    disabled
                    className="px-8 py-4 rounded-full bg-gray-200 text-gray-400 font-bold text-sm cursor-not-allowed"
                  >
                    준비중
                  </button>
                ) : product.price <= 0 ? null : user ? (
                  <Link
                    href={`/products/${product.slug}/checkout`}
                    className="inline-block px-8 py-4 rounded-full bg-[#111] text-white font-bold text-sm hover:bg-[#B7B2FF] transition-colors"
                  >
                    구매하기
                  </Link>
                ) : (
                  <Link
                    href={`/auth/login?redirect=/products/${product.slug}/checkout`}
                    className="inline-block px-8 py-4 rounded-full bg-[#111] text-white font-bold text-sm hover:bg-[#B7B2FF] transition-colors"
                  >
                    로그인하고 구매하기
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* 상세 설명 */}
          {product.description && (
            <div className="mt-12 bg-white rounded-2xl border border-[#111] p-8">
              <h2 className="text-lg font-black text-[#111] mb-4">상품 설명</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </main>

      <FooterNew />
    </div>
  );
}
