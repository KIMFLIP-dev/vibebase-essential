const CREEM_API_URL = process.env.CREEM_API_URL || "https://api.creem.io";
const CREEM_API_KEY = process.env.CREEM_API_KEY;

export interface CreemProduct {
  id: string;
  mode: string;
  object: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_type: "recurring" | "onetime";
  billing_period?: string;
  status: "active" | "archived";
  tax_mode?: "inclusive" | "exclusive";
  tax_category?: string;
  image_url?: string;
  features?: string[];
  product_url?: string;
  default_success_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_type: "recurring" | "onetime";
  billing_period?: string;
  tax_mode?: "inclusive" | "exclusive";
  tax_category?: string;
  image_url?: string;
  default_success_url?: string;
}

export interface CreateCheckoutInput {
  product_id: string;
  success_url: string;
  customer?: {
    email?: string;
    id?: string;
  };
  request_id?: string;
  discount_code?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  checkout_url: string;
}

export interface CreemSubscription {
  id: string;
  mode: "test" | "prod" | "sandbox";
  object: "subscription";
  status: "active" | "canceled" | "unpaid" | "paused" | "trialing" | "scheduled_cancel";
  created_at: string;
  updated_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    billing_type: string;
    billing_period?: string;
  };
  customer: {
    id: string;
    email: string;
  };
  next_transaction_date: string | null;
  canceled_at: string | null;
}

export interface CreemTransaction {
  id: string;
  mode: "test" | "prod" | "sandbox";
  object: "transaction";
  type: "payment" | "invoice";
  status: "succeeded" | "failed" | "pending" | "refunded" | "chargeback";
  amount: number;
  currency: string;
  refunded_amount: number;
  created_at: string;
  updated_at: string;
  subscription_id?: string;
  customer?: {
    id: string;
    email: string;
  };
}

export interface CreemTransactionSearchResponse {
  items: CreemTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchTransactionsParams {
  page?: number;
  pageSize?: number;
  startDate?: string; // ISO 날짜
  endDate?: string;   // ISO 날짜
}

class CreemClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!CREEM_API_KEY) {
      throw new Error("CREEM_API_KEY 환경변수가 설정되지 않았습니다.");
    }
    this.apiKey = CREEM_API_KEY;
    this.baseUrl = CREEM_API_URL;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Creem API 오류 (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async createProduct(input: CreateProductInput): Promise<CreemProduct> {
    return this.request<CreemProduct>("POST", "/v1/products", input as unknown as Record<string, unknown>);
  }

  async getProduct(productId: string): Promise<CreemProduct> {
    return this.request<CreemProduct>("GET", `/v1/products?product_id=${productId}`);
  }

  async listProducts(): Promise<{ items: CreemProduct[] }> {
    return this.request<{ items: CreemProduct[] }>("GET", "/v1/products/search");
  }

  /**
   * 조건에 맞는 기존 상품 찾기
   * @returns 매칭되는 active 상품 ID 또는 null
   */
  async findMatchingProduct(criteria: {
    name: string;
    price: number; // 센트 단위
    billing_type: "recurring" | "onetime";
    billing_period?: string;
  }): Promise<string | null> {
    try {
      const { items } = await this.listProducts();

      const match = items.find((product) => {
        // active 상태만
        if (product.status !== "active") return false;
        // 이름 일치
        if (product.name !== criteria.name) return false;
        // 가격 일치
        if (product.price !== criteria.price) return false;
        // billing_type 일치
        if (product.billing_type !== criteria.billing_type) return false;
        // recurring인 경우 billing_period도 일치해야 함
        if (criteria.billing_type === "recurring" && product.billing_period !== criteria.billing_period) {
          return false;
        }
        return true;
      });

      return match?.id || null;
    } catch (error) {
      console.error("상품 검색 실패:", error);
      return null;
    }
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    return this.request<CheckoutSession>("POST", "/v1/checkouts", input as unknown as Record<string, unknown>);
  }

  async checkProductExists(productId: string): Promise<boolean> {
    try {
      await this.getProduct(productId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 상품이 활성 상태인지 확인
   * @returns "active" | "archived" | "not_found"
   */
  async checkProductStatus(productId: string): Promise<"active" | "archived" | "not_found"> {
    try {
      const product = await this.getProduct(productId);
      return product.status || "active";
    } catch {
      return "not_found";
    }
  }

  /**
   * 구독 취소
   * @param subscriptionId Creem 구독 ID
   * @param mode "immediate" (즉시) 또는 "scheduled" (기간 종료 시)
   */
  async cancelSubscription(
    subscriptionId: string,
    mode: "immediate" | "scheduled" = "scheduled"
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      "POST",
      `/v1/subscriptions/${subscriptionId}/cancel`,
      { mode, onExecute: "cancel" }
    );
  }

  /**
   * 구독 상세 정보 조회
   * @param subscriptionId Creem 구독 ID
   */
  async getSubscription(subscriptionId: string): Promise<CreemSubscription> {
    return this.request<CreemSubscription>(
      "GET",
      `/v1/subscriptions?subscription_id=${subscriptionId}`
    );
  }

  /**
   * 구독 업그레이드
   * @param subscriptionId Creem 구독 ID
   * @param productId 업그레이드할 상품 ID
   * @param updateBehavior 청구 동작 (기본: 즉시 비례청구)
   */
  async upgradeSubscription(
    subscriptionId: string,
    productId: string,
    updateBehavior: "proration-charge-immediately" | "proration-charge" | "proration-none" = "proration-charge-immediately"
  ): Promise<CreemSubscription> {
    return this.request<CreemSubscription>(
      "POST",
      `/v1/subscriptions/${subscriptionId}/upgrade`,
      { product_id: productId, update_behavior: updateBehavior }
    );
  }

  /**
   * Order ID로 트랜잭션 검색 (환불 정보 확인용)
   * @param orderId Creem Order ID
   */
  async getTransactionsByOrderId(orderId: string): Promise<CreemTransactionSearchResponse> {
    return this.request<CreemTransactionSearchResponse>(
      "GET",
      `/v1/transactions/search?order_id=${orderId}&page_size=100`
    );
  }

  /**
   * Order ID로 환불 정보 조회
   * @param orderId Creem Order ID
   * @returns 환불 여부와 총 환불 금액 (센트 단위)
   */
  async getRefundInfoByOrderId(orderId: string): Promise<{ isRefunded: boolean; refundedAmount: number }> {
    try {
      const response = await this.getTransactionsByOrderId(orderId);
      const items = response.items || [];

      let totalRefunded = 0;
      for (const tx of items) {
        if (tx.refunded_amount && tx.refunded_amount > 0) {
          totalRefunded += tx.refunded_amount;
        }
      }

      return {
        isRefunded: totalRefunded > 0,
        refundedAmount: totalRefunded,
      };
    } catch (error) {
      console.error("트랜잭션 조회 실패:", error);
      return { isRefunded: false, refundedAmount: 0 };
    }
  }

  /**
   * 트랜잭션 검색 (페이징, 날짜 범위 필터)
   */
  async searchTransactions(params: SearchTransactionsParams = {}): Promise<CreemTransactionSearchResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) {
      queryParams.set("page", params.page.toString());
    }
    if (params.pageSize) {
      queryParams.set("page_size", params.pageSize.toString());
    }
    if (params.startDate) {
      queryParams.set("start_date", params.startDate);
    }
    if (params.endDate) {
      queryParams.set("end_date", params.endDate);
    }

    const queryString = queryParams.toString();
    const endpoint = `/v1/transactions/search${queryString ? `?${queryString}` : ""}`;

    return this.request<CreemTransactionSearchResponse>("GET", endpoint);
  }

  /**
   * 모든 트랜잭션 조회 (페이징 처리하여 전체 가져오기)
   */
  async getAllTransactions(params: { startDate?: string; endDate?: string } = {}): Promise<CreemTransaction[]> {
    const allTransactions: CreemTransaction[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await this.searchTransactions({
        page,
        pageSize,
        startDate: params.startDate,
        endDate: params.endDate,
      });

      allTransactions.push(...response.items);

      if (response.items.length < pageSize || allTransactions.length >= response.total) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return allTransactions;
  }
}

let creemClient: CreemClient | null = null;

export function getCreemClient(): CreemClient {
  if (!creemClient) {
    creemClient = new CreemClient();
  }
  return creemClient;
}

export function isCreemConfigured(): boolean {
  return !!CREEM_API_KEY;
}
