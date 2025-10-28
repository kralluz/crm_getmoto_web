// Product Category
export interface ProductCategory {
  product_category_id: number;
  product_category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// User info (para movimentações)
export interface StockMoveUser {
  user_id: number;
  name: string;
  email: string;
}

// Stock Movement
export interface StockMove {
  stock_move_id: number;
  product_id: number;
  user_id: number | null;
  move_type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
  quantity: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users?: StockMoveUser;
  products?: Product;
}

// Product
export interface Product {
  product_id: number;
  category_id: number;
  product_name: string;
  quantity: number;
  quantity_alert: number;
  buy_price: number;
  sell_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_category?: ProductCategory;
  stock_move?: StockMove[];
}

// Create Product Data
export interface CreateProductData {
  category_id: number;
  product_name: string;
  quantity?: number;
  quantity_alert?: number;
  buy_price: number;
  sell_price: number;
  is_active?: boolean;
}

// Update Product Data
export interface UpdateProductData {
  category_id?: number;
  product_name?: string;
  quantity?: number;
  quantity_alert?: number;
  buy_price?: number;
  sell_price?: number;
  is_active?: boolean;
}

// Create Stock Movement Data
export interface CreateStockMoveData {
  product_id: number;
  user_id?: number;
  move_type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
  quantity: number;
  notes?: string;
}

// Product Filters
export interface ProductFilters {
  active?: boolean;
  lowStock?: boolean;
}

// Stock Movement Filters
export interface StockMoveFilters {
  productId?: number;
  startDate?: string;
  endDate?: string;
}
