export interface PurchaseOrder {
  purchase_order_id: number | string;
  supplier_name: string;
  total_amount: number;
  purchase_date: string;
  notes?: string;
  is_active: boolean;
  cancelled_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  stock_moves?: Array<{
    stock_move_id: number;
    product_id: number;
    quantity: number;
    notes?: string;
    products: {
      product_id: number;
      product_name: string;
      sell_price: number;
      buy_price: number;
    };
  }>;
}

export interface PurchaseOrderProduct {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface CreatePurchaseOrderData {
  supplier_name: string;
  purchase_date: string;
  products: PurchaseOrderProduct[];
  notes?: string;
}

export interface UpdatePurchaseOrderData {
  supplier_name?: string;
  purchase_date?: string;
  notes?: string;
}

export interface CancelPurchaseOrderData {
  cancelled_by: number;
  cancellation_reason?: string;
}
