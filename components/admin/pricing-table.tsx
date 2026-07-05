"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Star, RefreshCw, CheckCircle, XCircle, Search, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingPlan } from "@/lib/types/admin";
import { DeletePlanDialog } from "./delete-plan-dialog";
import { togglePlanActive, syncPlanToCreem, verifyCreemSync, resetCreemSync, checkCreemSyncStatus } from "@/app/admin/pricing/actions";
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

export function PricingTable({ plans, canManage }: Props) {
  const router = useRouter();
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deletePlanName, setDeletePlanName] = useState<string>("");
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [resetPlanId, setResetPlanId] = useState<string | null>(null);
  const [resetPlanName, setResetPlanName] = useState<string>("");
  const [isResetting, setIsResetting] = useState(false);

  // Creem 상품 생성 확인 다이얼로그
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
      // 먼저 기존 상품 검색
      const status = await checkCreemSyncStatus(planId);

      // 새 상품 생성이 필요한지 확인
      if (status.needsMonthlyCreate || status.needsYearlyCreate) {
        // 다이얼로그 표시
        setCreateConfirmPlanId(planId);
        setCreateConfirmPlanName(planName);
        setCreateConfirmDetails({
          needsMonthly: status.needsMonthlyCreate,
          needsYearly: status.needsYearlyCreate,
        });
        setIsSyncing(null);
        return;
      }

      // 기존 상품만 연결 (새 생성 없음)
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

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>플랜명</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>가격</TableHead>
                <TableHead>기능</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="min-w-[200px]">Creem</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    등록된 가격 플랜이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id} className={!plan.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {plan.name}
                        {plan.is_popular && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            인기
                          </Badge>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.billing_type === "onetime" ? "secondary" : "outline"}>
                        {plan.billing_type === "onetime" ? "단건" : "구독"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.billing_type === "onetime" ? (
                        <span className="font-semibold">${formatPrice(plan.price_monthly)}</span>
                      ) : (
                        <div className="space-y-1">
                          <div>
                            <span className="font-semibold">${formatPrice(plan.price_monthly)}</span>
                            <span className="text-muted-foreground">/월</span>
                          </div>
                          {plan.price_yearly && (
                            <div className="text-sm">
                              <span className="font-semibold">${formatPrice(plan.price_yearly)}</span>
                              <span className="text-muted-foreground">/년</span>
                              {plan.price_yearly < plan.price_monthly * 12 && (
                                <Badge variant="outline" className="ml-2 text-green-600 text-xs">
                                  {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}% 할인
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {plan.features.slice(0, 1).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {plan.features.length > 1 && (
                          <Badge variant="outline" className="text-xs">
                            +{plan.features.length - 1}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isVerifying === plan.id ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">확인 중...</span>
                        </div>
                      ) : isSyncing === plan.id ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">동기화 중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className={`gap-1 ${plan.creem_product_id ? "text-green-600 border-green-600" : "text-muted-foreground"}`}
                              >
                                {plan.creem_product_id ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
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
                                  {plan.creem_product_id_yearly ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                  연간
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {plan.creem_product_id_yearly ? `ID: ${plan.creem_product_id_yearly}` : "미연동"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/pricing/${plan.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              수정
                            </Link>
                          </DropdownMenuItem>
                          {canManage && (
                            <>
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
                              {(!plan.creem_product_id || (plan.billing_type === "recurring" && plan.price_yearly && !plan.creem_product_id_yearly)) && (
                                <DropdownMenuItem
                                  onClick={() => handleSyncToCreem(plan.id, plan.name)}
                                  disabled={isSyncing === plan.id}
                                >
                                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing === plan.id ? "animate-spin" : ""}`} />
                                  Creem 동기화
                                </DropdownMenuItem>
                              )}
                              {(plan.creem_product_id || plan.creem_product_id_yearly) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleVerifySync(plan.id)}
                                    disabled={isVerifying === plan.id}
                                  >
                                    <Search className={`h-4 w-4 mr-2 ${isVerifying === plan.id ? "animate-pulse" : ""}`} />
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
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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

        <AlertDialog open={!!createConfirmPlanId} onOpenChange={(open) => !open && setCreateConfirmPlanId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Creem 상품 생성</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <strong>{createConfirmPlanName}</strong> 플랜에 대한 Creem 상품을 새로 생성하시겠습니까?
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
              <AlertDialogAction
                onClick={handleCreateConfirm}
                disabled={isCreating}
              >
                {isCreating ? "생성 중..." : "상품 생성"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
