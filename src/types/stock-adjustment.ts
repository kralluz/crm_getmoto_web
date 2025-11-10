export type AdjustmentType = 'increase' | 'decrease';

export type AdjustmentReason =
  | 'breakage'
  | 'expiration'
  | 'inventory_correction'
  | 'theft'
  | 'other';

export interface StockAdjustment {
  stock_move_id: number | string;
  product_id: number;
  user_id?: number;
  move_type: string;
  quantity: number;
  notes?: string;
  is_reversal: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStockAdjustmentData {
  product_id: number;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: AdjustmentReason;
  notes?: string;
  user_id?: number;
}
