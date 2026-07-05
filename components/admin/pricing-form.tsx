"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createPricingPlan, updatePricingPlan } from "@/app/admin/pricing/actions";
import type { PricingPlan, BillingType } from "@/lib/types/admin";
import { X, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  plan?: PricingPlan;
  mode: "create" | "edit";
}

export function PricingForm({ plan, mode }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(plan?.name || "");
  const [description, setDescription] = useState(plan?.description || "");
  const [billingType, setBillingType] = useState<BillingType>(plan?.billing_type || "recurring");
  const [priceMonthly, setPriceMonthly] = useState(plan?.price_monthly?.toString() || "");
  const [priceYearly, setPriceYearly] = useState(plan?.price_yearly?.toString() || "");
  const [features, setFeatures] = useState<string[]>(plan?.features || [""]);
  const [displayOrder, setDisplayOrder] = useState(plan?.display_order?.toString() || "0");
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);
  const [isPopular, setIsPopular] = useState(plan?.is_popular ?? false);
  const [autoSyncCreem, setAutoSyncCreem] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState(plan?.download_url || "");

  const handleAddFeature = () => {
    setFeatures([...features, ""]);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const filteredFeatures = features.filter((f) => f.trim() !== "");
      const input = {
        name,
        description: description || null,
        billing_type: billingType,
        price_monthly: parseFloat(priceMonthly) || 0,
        price_yearly: billingType === "recurring" && priceYearly ? parseFloat(priceYearly) : null,
        currency: "USD",
        features: filteredFeatures,
        display_order: parseInt(displayOrder) || 0,
        is_active: isActive,
        is_popular: isPopular,
        download_url: billingType === "onetime" && downloadUrl.trim() ? downloadUrl.trim() : null,
      };

      if (mode === "create") {
        await createPricingPlan(input, autoSyncCreem);
      } else if (plan) {
        await updatePricingPlan(plan.id, input);
      }

      router.push("/admin/pricing");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>플랜의 기본 정보를 입력합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">플랜명 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Basic, Pro, Enterprise"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="플랜에 대한 간단한 설명"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingType">결제 유형 *</Label>
            <Select
              value={billingType}
              onValueChange={(value: BillingType) => setBillingType(value)}
            >
              <SelectTrigger id="billingType" className="w-full">
                <SelectValue placeholder="결제 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">구독 (정기결제)</SelectItem>
                <SelectItem value="onetime">단건결제 (1회성)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {billingType === "recurring"
                ? "월간/연간 정기 결제 상품입니다."
                : "1회성 결제 상품입니다. (예: 다운로드, 라이선스)"}
            </p>
          </div>

          {billingType === "recurring" ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceMonthly">월간 가격 (USD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="priceMonthly"
                  type="number"
                  step="0.01"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                  placeholder="9.99"
                  min="0"
                  required
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceYearly">연간 가격 (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="priceYearly"
                  type="number"
                  step="0.01"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(e.target.value)}
                  placeholder="99.90"
                  min="0"
                  className="pl-7"
                />
              </div>
              {priceYearly && priceMonthly && (
                <p className="text-sm text-muted-foreground">
                  월 ${(parseFloat(priceYearly) / 12).toFixed(2)}
                  {parseFloat(priceYearly) < parseFloat(priceMonthly) * 12 && (
                    <span className="text-green-600 ml-1">
                      ({Math.round((1 - parseFloat(priceYearly) / (parseFloat(priceMonthly) * 12)) * 100)}% 할인)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="priceMonthly">가격 (USD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="priceMonthly"
                  type="number"
                  step="0.01"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                  placeholder="29.99"
                  min="0"
                  required
                  className="pl-7"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                1회성 결제 금액입니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="downloadUrl">다운로드 URL</Label>
              <Input
                id="downloadUrl"
                type="url"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://example.com/download/file.zip"
              />
              <p className="text-sm text-muted-foreground">
                구매자가 다운로드할 수 있는 링크입니다. (선택사항)
              </p>
            </div>
          </>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayOrder">표시 순서</Label>
            <Input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="0"
              min="0"
              className="w-24"
            />
            <p className="text-sm text-muted-foreground">
              숫자가 작을수록 먼저 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>기능 목록</CardTitle>
          <CardDescription>이 플랜에 포함된 기능들을 입력합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                placeholder={`기능 ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFeature(index)}
                disabled={features.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddFeature}>
            <Plus className="h-4 w-4 mr-2" />
            기능 추가
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>옵션</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "create" && (
            <div className="flex items-center space-x-2 pb-4 border-b mb-4">
              <Checkbox
                id="autoSyncCreem"
                checked={autoSyncCreem}
                onCheckedChange={(checked) => setAutoSyncCreem(checked === true)}
              />
              <Label htmlFor="autoSyncCreem" className="font-normal">
                Creem 상품 자동 생성 <span className="text-muted-foreground">(Creem API KEY 필요)</span>
              </Label>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="isActive" className="font-normal">
              활성화 (사용자에게 표시)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPopular"
              checked={isPopular}
              onCheckedChange={(checked) => setIsPopular(checked === true)}
            />
            <Label htmlFor="isPopular" className="font-normal">
              인기 플랜 배지 표시
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : mode === "create" ? "플랜 생성" : "변경사항 저장"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/pricing")}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
