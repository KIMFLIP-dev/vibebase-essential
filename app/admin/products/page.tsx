import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getAdminProducts } from "@/app/admin/products/actions";
import { ProductsTable } from "@/components/admin/products-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

async function ProductsContent() {
  noStore();
  const products = await getAdminProducts();
  return <ProductsTable products={products} />;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">상품 관리</h2>
          <p className="text-sm text-muted-foreground">
            단건 판매 상품을 등록하고 관리합니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-1" />새 상품
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ProductsContent />
      </Suspense>
    </div>
  );
}
