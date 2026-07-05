// =====================================================
// 상품 / 단건 결제 관련 타입 정의
// =====================================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  download_url: string | null;
  is_published: boolean;
  is_coming_soon: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  slug?: string; // 비우면 name에서 자동 생성
  description?: string | null;
  short_description?: string | null;
  thumbnail_url?: string | null;
  price?: number;
  original_price?: number | null;
  currency?: string;
  download_url?: string | null;
  is_published?: boolean;
  is_coming_soon?: boolean;
  display_order?: number;
}

export type PurchaseStatus = "completed" | "refunded" | "failed";

export interface ProductPurchase {
  id: string;
  user_id: string | null;
  product_id: string | null;
  product_name: string | null; // 구매 시점 상품명 스냅샷

  order_id: string | null; // 상점 주문번호
  portone_payment_id: string | null; // PortOne paymentId

  status: PurchaseStatus;

  amount: number;
  currency: string;
  payment_method: string | null;
  receipt_url: string | null;

  is_refunded: boolean;
  refunded_amount: number;
  refunded_at: string | null;

  created_at: string;
  updated_at: string;

  // 조인 데이터
  product?: Product | null;
  user?: {
    email: string;
    user_metadata: Record<string, unknown>;
  };
}

export type PendingOrderStatus = "pending" | "completed" | "expired";

export interface PendingOrder {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: PendingOrderStatus;
  created_at: string;
  updated_at: string;
  expires_at: string;
}
