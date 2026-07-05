import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">새 상품</h2>
        <p className="text-sm text-muted-foreground">
          단건 판매 상품을 등록합니다.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
