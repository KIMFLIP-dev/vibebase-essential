import Link from "next/link";
import { Package } from "lucide-react";
import type { Product } from "@/lib/types/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount =
    product.original_price != null &&
    product.original_price > product.price &&
    product.price > 0;

  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.original_price!) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-[#111] overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        {/* 썸네일 */}
        <div className="aspect-video bg-[#F9F9FB] relative overflow-hidden">
          {product.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-[#B7B2FF]" />
            </div>
          )}
          {product.is_coming_soon && (
            <span className="absolute top-3 right-3 text-xs font-bold text-[#111] bg-[#7FFF00]/70 rounded-full px-2.5 py-1">
              준비중
            </span>
          )}
        </div>

        {/* 본문 */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-lg font-black text-[#111] group-hover:text-[#B7B2FF] transition-colors">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {product.short_description}
            </p>
          )}

          {/* 가격 */}
          <div className="mt-auto pt-4">
            {product.is_coming_soon ? (
              <span className="text-sm font-bold text-gray-400">곧 출시</span>
            ) : product.price <= 0 ? (
              <span className="text-xl font-black text-[#111]">무료</span>
            ) : (
              <div className="flex items-center gap-2">
                {hasDiscount && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      ₩{product.original_price!.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#B7B2FF] text-white">
                      {discountPercent}%
                    </span>
                  </>
                )}
                <span className="text-xl font-black text-[#111]">
                  ₩{product.price.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
