export type ServiceOrderStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceCategory {
  service_id: number;
  service_name: string;
  service_cost: number;
}

export interface ServiceProduct {
  service_product_id: number;
  service_order_id: number;
  product_id: number;
  product_qtd: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products: {
    product_id: number;
    product_name: string;
    buy_price?: number;
    sell_price: number;
  };
}

export interface ServiceRealized {
  services_realized_id: number;
  service_order_id: number;
  service_id: number;
  service_qtd: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  service: ServiceCategory;
}

export interface Vehicle {
  vehicle_id: number;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color?: string;
}

export interface CashFlow {
  cash_flow_id: number;
  amount: number;
  direction: 'in' | 'out';
  occurred_at: string;
  note: string;
}

export interface ServiceOrder {
  service_order_id: number;
  service_id?: number;
  professional_name?: string;
  vehicle_id?: number;
  customer_name?: string;
  service_description?: string;
  diagnosis?: string;
  status: ServiceOrderStatus;
  finalized_at?: string;
  estimated_labor_cost?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  service?: ServiceCategory;
  vehicles?: Vehicle;
  service_products?: ServiceProduct[];
  services_realized?: ServiceRealized[];
  cash_flow?: CashFlow[];
}

export interface CreateServiceOrderData {
  service_id?: number;
  professional_name?: string;
  vehicle_id?: number;
  customer_name?: string;
  service_description?: string;
  diagnosis?: string;
  status?: ServiceOrderStatus;
  estimated_labor_cost?: number;
  notes?: string;
}

export interface UpdateServiceOrderData extends Partial<CreateServiceOrderData> {
  finalized_at?: string;
}

export interface ServiceOrderListParams {
  status?: ServiceOrderStatus;
  customer_name?: string;
}
