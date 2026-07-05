"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  RefreshCw,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  RotateCcw,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingPlan } from "@/lib/types/admin";
import { DeletePlanDialog } from "./delete-plan-dialog";
import {
  togglePlanActive,
  syncPlanToCreem,
  verifyCreemSync,
  resetCreemSync,
  checkCreemSyncStatus,
} from "@/app/admin/pricing/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  plans: PricingPlan[];
  canManage: boolean;
}

function formatPrice(dollars: number): string {
  return dollars.toFixed(2);
}

export function PricingCards({ plans, canManage }: Props) {
  const router = useRouter();
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deletePlanName, setDeletePlanName] = useState<string>("");
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [resetPlanId, setResetPlanId] = useState<string | null>(null);
  const [resetPlanName, setResetPlanName] = useState<string>("");
  const [isResetting, setIsResetting] = useState(false);

  const [createConfirmPlanId, setCreateConfirmPlanId] = useState<string | null>(null);
  const [createConfirmPlanName, setCreateConfirmPlanName] = useState<string>("");
  const [createConfirmDetails, setCreateConfirmDetails] = useState<{
    needsMonthly: boolean;
    needsYearly: boolean;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleDeleteClick = (planId: string, planName: string) => {
    setDeletePlanId(planId);
    setDeletePlanName(planName);
  };

  const handleToggleActive = async (planId: string) => {
    setIsToggling(planId);
    try {
      await togglePlanActive(planId);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle plan:", error);
    } finally {
      setIsToggling(null);
    }
  };

  const handleSyncToCreem = async (planId: string, planName: string) => {
    setIsSyncing(planId);
    try {
      const status = await checkCreemSyncStatus(planId);

      if (status.needsMonthlyCreate || status.needsYearlyCreate) {
        setCreateConfirmPlanId(planId);
        setCreateConfirmPlanName(planName);
        setCreateConfirmDetails({
          needsMonthly: status.needsMonthlyCreate,
          needsYearly: status.needsYearlyCreate,
        });
        setIsSyncing(null);
        return;
      }

      await syncPlanToCreem(planId, false);
      toast.success("Creem 동기화 완료", {
        description: "기존 상품과 연결되었습니다.",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to sync to Creem:", error);
      toast.error("동기화 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsSyncing(null);
    }
  };

  const handleCreateConfirm = async () => {
    if (!createConfirmPlanId) return;

    setIsCreating(true);
    try {
      await syncPlanToCreem(createConfirmPlanId, true);
      toast.success("Creem 동기화 완료", {
        description: "새 상품이 생성되었습니다.",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to create Creem product:", error);
      toast.error("상품 생성 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsCreating(false);
      setCreateConfirmPlanId(null);
      setCreateConfirmDetails(null);
    }
  };

  const handleVerifySync = async (planId: string) => {
    setIsVerifying(planId);
    try {
      const result = await verifyCreemSync(planId);
      if (result.cleaned) {
        const monthlyStatus = result.monthly
          ? "유효 ✓"
          : result.monthlyArchived
            ? "Archived (초기화됨)"
            : "미존재 (초기화됨)";
        const yearlyStatus = result.yearly
          ? "유효 ✓"
          : result.yearlyArchived
            ? "Archived (초기화됨)"
            : "미존재 (초기화됨)";

        toast.warning("연동 확인 완료", {
          description: `월간: ${monthlyStatus} / 연간: ${yearlyStatus}`,
        });
        router.refresh();
      } else {
        toast.success("연동 확인 완료", {
          description: "모든 상품이 활성 상태입니다.",
        });
      }
    } catch (error) {
      console.error("Failed to verify Creem sync:", error);
      toast.error("확인 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsVerifying(null);
    }
  };

  const handleResetClick = (planId: string, planName: string) => {
    setResetPlanId(planId);
    setResetPlanName(planName);
  };

  const handleResetConfirm = async () => {
    if (!resetPlanId) return;

    setIsResetting(true);
    try {
      await resetCreemSync(resetPlanId);
      toast.success("연동 초기화 완료", {
        description: "Creem 연동이 초기화되었습니다.",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to reset Creem sync:", error);
      toast.error("초기화 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsResetting(false);
      setResetPlanId(null);
    }
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 가격 플랜이 없습니다.
      </div>
    );
  }

  const recurringPlans = plans.filter((plan) => plan.billing_type === "recurring");
  const onetimePlans = plans.filter((plan) => plan.billing_type === "onetime");

  const renderPlanCard = (plan: PricingPlan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${!plan.is_active ? "opacity-50" : ""}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {plan.is_popular && (
                        <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 border-blue-200">
                          <Star className="h-3 w-3 fill-current" />
                          인기
                        </Badge>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant={plan.billing_type === "onetime" ? "secondary" : "outline"}>
                      {plan.billing_type === "onetime" ? "단건" : "구독"}
                    </Badge>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "활성" : "비활성"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* 가격 */}
                <div className="space-y-1">
                  {plan.billing_type === "onetime" ? (
                    <div>
                      <span className="text-2xl font-bold">${formatPrice(plan.price_monthly)}</span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-2xl font-bold">${formatPrice(plan.price_monthly)}</span>
                        <span className="text-muted-foreground">/월</span>
                      </div>
                      {plan.price_yearly && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">${formatPrice(plan.price_yearly)}</span>
                          <span className="text-muted-foreground text-sm">/년</span>
                          {plan.price_yearly < plan.price_monthly * 12 && (
                            <Badge variant="outline" className="text-green-600 text-xs">
                              {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}% 할인
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 기능 목록 */}
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-4 border-t">
                {/* Creem 연동 상태 */}
                <div className="w-full">
                  {isVerifying === plan.id || isSyncing === plan.id ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isVerifying === plan.id ? "확인 중..." : "동기화 중..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Creem:</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${plan.creem_product_id ? "text-green-600 border-green-600" : "text-muted-foreground"}`}
                          >
                            {plan.creem_product_id ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {plan.billing_type === "onetime" ? "상품" : "월간"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {plan.creem_product_id ? `ID: ${plan.creem_product_id}` : "미연동"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      {plan.billing_type === "recurring" && plan.price_yearly && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="outline"
                              className={`gap-1 ${plan.creem_product_id_yearly ? "text-green-600 border-green-600" : "text-muted-foreground"}`}
                            >
                              {plan.creem_product_id_yearly ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              연간
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {plan.creem_product_id_yearly
                                ? `ID: ${plan.creem_product_id_yearly}`
                                : "미연동"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="w-full flex items-center justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/pricing/${plan.id}`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      수정
                    </Link>
                  </Button>

                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(plan.id)}
                          disabled={isToggling === plan.id}
                        >
                          {plan.is_active ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              비활성화
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              활성화
                            </>
                          )}
                        </DropdownMenuItem>
                        {(!plan.creem_product_id ||
                          (plan.billing_type === "recurring" &&
                            plan.price_yearly &&
                            !plan.creem_product_id_yearly)) && (
                          <DropdownMenuItem
                            onClick={() => handleSyncToCreem(plan.id, plan.name)}
                            disabled={isSyncing === plan.id}
                          >
                            <RefreshCw
                              className={`h-4 w-4 mr-2 ${isSyncing === plan.id ? "animate-spin" : ""}`}
                            />
                            Creem 동기화
                          </DropdownMenuItem>
                        )}
                        {(plan.creem_product_id || plan.creem_product_id_yearly) && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleVerifySync(plan.id)}
                              disabled={isVerifying === plan.id}
                            >
                              <Search
                                className={`h-4 w-4 mr-2 ${isVerifying === plan.id ? "animate-pulse" : ""}`}
                              />
                              연동 확인
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResetClick(plan.id, plan.name)}
                              className="text-orange-600"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              연동 초기화
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(plan.id, plan.name)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardFooter>
            </Card>
  );

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* 구독 플랜 섹션 */}
        {recurringPlans.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">구독 플랜</h2>
              <Badge variant="outline" className="text-muted-foreground">
                {recurringPlans.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recurringPlans.map(renderPlanCard)}
            </div>
          </section>
        )}

        {/* 단건 상품 섹션 */}
        {onetimePlans.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">단건 상품</h2>
              <Badge variant="outline" className="text-muted-foreground">
                {onetimePlans.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {onetimePlans.map(renderPlanCard)}
            </div>
          </section>
        )}

        <DeletePlanDialog
          planId={deletePlanId}
          planName={deletePlanName}
          open={!!deletePlanId}
          onOpenChange={(open) => !open && setDeletePlanId(null)}
        />

        <AlertDialog open={!!resetPlanId} onOpenChange={(open) => !open && setResetPlanId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Creem 연동 초기화</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{resetPlanName}</strong> 플랜의 Creem 연동을 초기화하시겠습니까?
                <br />
                <br />
                월간/연간 상품 ID가 모두 삭제되며, 다시 동기화해야 결제가 가능합니다.
                <br />
                크림의 결제상품이 제거되는것은 아니며, 재동기화 시 기존 상품이 다시 연결됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResetting}>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetConfirm}
                disabled={isResetting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isResetting ? "초기화 중..." : "초기화"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!createConfirmPlanId}
          onOpenChange={(open) => !open && setCreateConfirmPlanId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Creem 상품 생성</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <strong>{createConfirmPlanName}</strong> 플랜에 대한 Creem 상품을 새로
                  생성하시겠습니까?
                  <br />
                  <br />
                  <div className="text-sm space-y-1">
                    {createConfirmDetails?.needsMonthly && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>월간 상품 생성 필요</span>
                      </div>
                    )}
                    {createConfirmDetails?.needsYearly && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>연간 상품 생성 필요</span>
                      </div>
                    )}
                  </div>
                  <br />
                  기존에 동일한 이름과 가격의 상품이 없어 새로 생성됩니다.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCreating}>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateConfirm} disabled={isCreating}>
                {isCreating ? "생성 중..." : "상품 생성"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
