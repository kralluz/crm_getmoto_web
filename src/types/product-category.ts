export interface ProductCategory {
  product_category_id: number;
  product_category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    products: number;
  };
}

export interface ProductCategoryWithStats extends ProductCategory {
  stats?: {
    total_products: number;
    recent_products: Array<{
      product_id: number;
      product_name: string;
      quantity: any;
      buy_price: any;
      sell_price: any;
    }>;
  };
}

export interface CreateProductCategoryData {
  product_category_name: string;
  is_active?: boolean;
}

export interface UpdateProductCategoryData {
  product_category_name?: string;
  is_active?: boolean;
}

export interface ProductCategoryFilters {
  is_active?: boolean;
}
