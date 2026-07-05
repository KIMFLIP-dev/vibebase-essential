"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import type { Product } from "@/lib/types/product";

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const isEdit = !!product;
  const router = useRouter();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(
    product?.short_description ?? ""
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnail_url ?? "");
  const [price, setPrice] = useState(String(product?.price ?? 0));
  const [originalPrice, setOriginalPrice] = useState(
    product?.original_price != null ? String(product.original_price) : ""
  );
  const [downloadUrl, setDownloadUrl] = useState(product?.download_url ?? "");
  const [isPublished, setIsPublished] = useState(product?.is_published ?? false);
  const [isComingSoon, setIsComingSoon] = useState(
    product?.is_coming_soon ?? false
  );
  const [displayOrder, setDisplayOrder] = useState(
    String(product?.display_order ?? 0)
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const input = {
      name,
      slug: slug || undefined,
      short_description: shortDescription || null,
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      price: Number(price || 0),
      original_price: originalPrice ? Number(originalPrice) : null,
      download_url: downloadUrl || null,
      is_published: isPublished,
      is_coming_soon: isComingSoon,
      display_order: Number(displayOrder || 0),
    };

    try {
      if (isEdit) {
        await updateProduct(product.id, input);
        toast.success("상품이 수정되었습니다.");
      } else {
        await createProduct(input);
        toast.success("상품이 등록되었습니다.");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              상품명 *
            </label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="상품명"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-sm font-medium">
              슬러그
            </label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="비우면 상품명에서 자동 생성"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="short-description" className="text-sm font-medium">
              한 줄 설명
            </label>
            <Input
              id="short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="목록 카드에 표시되는 짧은 설명"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">
              상세 설명
            </label>
            <Textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품 상세 페이지에 표시되는 설명"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="thumbnail-url" className="text-sm font-medium">
              썸네일 URL
            </label>
            <Input
              id="thumbnail-url"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">가격</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="price" className="text-sm font-medium">
                판매가 (원) *
              </label>
              <Input
                id="price"
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">0이면 무료 상품</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="original-price" className="text-sm font-medium">
                정가 (원)
              </label>
              <Input
                id="original-price"
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="할인 표시용 (선택)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">제공물 · 노출</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="download-url" className="text-sm font-medium">
              다운로드 URL
            </label>
            <Input
              id="download-url"
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="구매자에게 제공할 링크 (선택)"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="display-order" className="text-sm font-medium">
              노출 순서
            </label>
            <Input
              id="display-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-32"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <span className="text-sm">공개 (상품 목록에 노출)</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={isComingSoon}
              onCheckedChange={(checked) => setIsComingSoon(checked === true)}
            />
            <span className="text-sm">준비중 (구매 버튼 비활성화)</span>
          </label>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              저장 중...
            </>
          ) : isEdit ? (
            "수정하기"
          ) : (
            "등록하기"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
