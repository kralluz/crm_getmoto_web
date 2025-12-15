export interface ServiceCategory {
  service_id: number;
  service_name: string;
  service_cost: any;
  service_cost_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategoryWithRelations extends ServiceCategory {
  service_order?: Array<{
    service_order_id: number;
    customer_name: string;
    status: string;
    created_at: string;
  }>;
  services_realized?: Array<{
    services_realized_id: number;
    service_order_id: number;
    service_qtd: any;
    created_at: string;
    service_order?: {
      service_order_id: number;
      customer_name: string;
      status: string;
      description?: string;
      service_date: string;
      motorcycle?: {
        motorcycle_id: number;
        license_plate: string;
        model: string;
        brand: string;
        year: number;
        client?: {
          client_id: number;
          client_name: string;
          phone: string;
        };
      };
    };
  }>;
}

export interface ServiceCategoryWithStats extends ServiceCategoryWithRelations {
  stats?: {
    total_orders: number;
    total_services_realized: number;
    estimated_revenue: any;
  };
}

export interface CreateServiceCategoryData {
  service_name: string;
  service_cost: number;
  is_active?: boolean;
}

export interface UpdateServiceCategoryData {
  service_name?: string;
  service_cost?: number;
  is_active?: boolean;
}

export interface ServiceCategoryFilters {
  is_active?: boolean;
}
