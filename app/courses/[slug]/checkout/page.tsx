import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug, hasUserPurchasedCourse, createPendingOrder } from "../../actions";
import { PortOnePaymentWidget } from "@/components/courses/portone-payment-widget";
import { NavbarNew } from "@/components/common_new/navbar";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=/courses/${slug}/checkout`);
  }

  const course = await getCourseBySlug(slug);

  if (!course) {
    redirect("/courses");
  }

  if (course.price <= 0) {
    redirect(`/courses/${slug}`);
  }

  const purchased = await hasUserPurchasedCourse(course.id);
  if (purchased) {
    redirect(`/courses/${slug}`);
  }

  const { orderId, amount, orderName } = await createPendingOrder(course.id);
  const paymentId = `pay${crypto.randomUUID().replace(/-/g, "").slice(0, 36)}`;

  const hasDiscount =
    course.original_price != null &&
    course.original_price > course.price &&
    course.price > 0;

  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / course.original_price!) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#F9F9FB] font-sans">
      <NavbarNew />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-lg mx-auto">
          {/* 뒤로가기 */}
          <Link
            href={`/courses/${slug}`}
            className="inline-flex items-center gap-1 text-sm font-bold text-[#111] hover:text-[#B7B2FF] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            코스로 돌아가기
          </Link>

          {/* 주문 정보 카드 */}
          <div className="bg-white rounded-2xl border border-[#111] p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-[#111]" />
              <h2 className="text-lg font-black text-[#111]">주문 정보</h2>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-[#111] text-lg">{course.title}</p>
                <p className="text-sm text-gray-500 mt-1">온라인 강좌</p>
              </div>
              <div className="text-right">
                {hasDiscount && (
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="text-sm text-gray-400 line-through">
                      ₩{course.original_price!.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#B7B2FF] text-white">
                      {discountPercent}%
                    </span>
                  </div>
                )}
                <p className="text-2xl font-black text-[#111]">
                  {amount.toLocaleString()}원
                </p>
              </div>
            </div>
          </div>

          {/* 결제 위젯 */}
          <PortOnePaymentWidget
            paymentId={paymentId}
            orderId={orderId}
            orderName={orderName}
            amount={amount}
            courseSlug={slug}
            customerEmail={user.email}
            customerName={user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "구매자"}
            customerPhoneNumber={user.user_metadata?.phone || user.phone || "010-0000-0000"}
          />
        </div>
      </main>
    </div>
  );
}
