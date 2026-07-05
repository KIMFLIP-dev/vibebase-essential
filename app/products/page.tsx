import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getPublishedProducts } from "@/app/products/actions";
import { ProductCard } from "@/components/products/product-card";
import { NavbarNew } from "@/components/common/navbar";
import { FooterNew } from "@/components/landing/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

export const metadata = {
  title: "상품",
  description: "판매 중인 상품을 둘러보세요.",
};

async function ProductsContent() {
  noStore();
  const products = await getPublishedProducts();

  if (products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Package className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">판매 중인 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />
      <main className="flex-1 pt-36 pb-20">
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <h1 className="text-4xl font-black text-[#111]">상품</h1>
          <p className="text-gray-500 mt-2">판매 중인 상품을 둘러보세요.</p>
        </div>
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductsContent />
        </Suspense>
      </main>
      <FooterNew />
    </div>
  );
}
