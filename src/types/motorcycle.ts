// Interface baseada na tabela vehicles do banco de dados
export interface Motorcycle {
  vehicle_id: number;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  plate: string;
  year?: number | null;
  mile?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    service_order: number;
  };
  service_order?: Array<{
    service_order_id: number;
    status: string;
    service_description?: string | null;
    created_at: string;
    finalized_at?: string | null;
  }>;
}

export interface CreateMotorcycleData {
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  plate: string;
  year?: number | null;
  mile?: number | null;
  is_active?: boolean;
}

export interface UpdateMotorcycleData {
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  plate?: string;
  year?: number | null;
  mile?: number | null;
  is_active?: boolean;
}
