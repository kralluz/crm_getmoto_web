export interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  code?: string;
  barcode?: string;
  category?: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  brand?: string;
  code?: string;
  barcode?: string;
  category?: string;
  costPrice: number;
  salePrice: number;
  stockQuantity?: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  active?: boolean;
}
