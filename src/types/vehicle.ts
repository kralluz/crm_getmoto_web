export interface Vehicle {
  vehicle_id: number | string;
  brand?: string;
  model?: string;
  year?: number;
  mile?: number;
  plate: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    service_order: number;
  };
  service_order?: ServiceOrderSummary[];
}

export interface ServiceOrderSummary {
  service_order_id: number;
  status: string;
  customer_name?: string;
  service_description?: string;
  created_at: string;
  finalized_at?: string;
}

export interface VehicleStats {
  vehicle: Vehicle;
  stats: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    draftOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    lastService: string | null;
    lastFinalized: string | null;
    averagePerOrder: number;
  };
}

export interface VehicleFilters {
  is_active?: boolean;
  search?: string;
}
