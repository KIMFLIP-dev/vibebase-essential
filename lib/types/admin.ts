export type UserRole = "user" | "admin" | "super_admin";

export interface AdminUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  user_metadata: {
    role?: UserRole;
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  app_metadata: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
}

export interface UsersListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  perPage: number;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export type BillingType = "recurring" | "onetime";

export interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  billing_type: BillingType;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  features: string[];
  display_order: number;
  is_active: boolean;
  is_popular: boolean;
  creem_product_id: string | null;
  creem_product_id_yearly: string | null;
  download_url: string | null;
  created_at: string;
  updated_at: string;
}

export type PricingPlanInput = Omit<
  PricingPlan,
  "id" | "creem_product_id" | "creem_product_id_yearly" | "created_at" | "updated_at"
>;

// Creem 상태 그대로 사용 (만료 여부는 current_period_end로 판단)
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "unpaid"
  | "paused"
  | "trialing"
  | "scheduled_cancel";

export interface Subscription {
  id: string;
  user_id: string | null;
  plan_id: string | null;

  creem_subscription_id: string | null;
  creem_customer_id: string | null;
  creem_order_id: string | null;
  creem_checkout_id: string | null;
  creem_product_id: string | null;

  status: SubscriptionStatus;
  billing_period: "monthly" | "yearly";

  amount: number;
  currency: string;

  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;

  is_refunded: boolean;
  refunded_amount: number;

  created_at: string;
  updated_at: string;

  // 조인 데이터
  plan?: PricingPlan;
  user?: {
    email: string;
    user_metadata: Record<string, unknown>;
  };
}

export type TransactionType = "payment" | "invoice";
export type TransactionStatus = "paid" | "failed" | "pending" | "refunded" | "chargeback";

export interface Transaction {
  id: string;
  creem_transaction_id: string;
  creem_order_id: string | null;
  creem_subscription_id: string | null;
  creem_customer_id: string | null;
  user_email: string | null;

  type: TransactionType;
  status: TransactionStatus;

  amount: number; // 센트 단위
  currency: string;
  refunded_amount: number;

  creem_created_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionsListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  perPage: number;
}

// 단건 결제 (Purchases)
export type PurchaseStatus = "completed" | "refunded" | "failed";

export interface Purchase {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  creem_checkout_id: string | null;
  creem_order_id: string | null;
  creem_customer_id: string | null;
  creem_product_id: string | null;
  status: PurchaseStatus;
  amount: number;
  currency: string;
  is_refunded: boolean;
  refunded_amount: number;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  plan?: PricingPlan;
  user?: {
    email: string;
    user_metadata: Record<string, unknown>;
  };
}

export interface PurchasesListResponse {
  purchases: Purchase[];
  total: number;
  page: number;
  perPage: number;
}
