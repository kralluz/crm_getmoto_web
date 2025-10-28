import { customAxiosInstance } from './axios-instance';
import type { 
  Product, 
  CreateProductData, 
  UpdateProductData,
  StockMove,
  CreateStockMoveData,
  ProductFilters,
  StockMoveFilters
} from '../types/product';

const BASE_URL = '/api/products';

export const productApi = {
  // ========== PRODUTOS ==========
  
  async getAll(params?: ProductFilters) {
    return customAxiosInstance<Product[]>({
      url: BASE_URL,
      method: 'GET',
      params,
    });
  },

  async getById(id: number) {
    return customAxiosInstance<Product>({
      url: `${BASE_URL}/${id}`,
      method: 'GET',
    });
  },

  async create(data: CreateProductData) {
    return customAxiosInstance<Product>({
      url: BASE_URL,
      method: 'POST',
      data,
    });
  },

  async update(id: number, data: UpdateProductData) {
    return customAxiosInstance<Product>({
      url: `${BASE_URL}/${id}`,
      method: 'PUT',
      data,
    });
  },

  async delete(id: number) {
    return customAxiosInstance<void>({
      url: `${BASE_URL}/${id}`,
      method: 'DELETE',
    });
  },

  async getLowStock() {
    return customAxiosInstance<Product[]>({
      url: BASE_URL,
      method: 'GET',
      params: { lowStock: true },
    });
  },

  // ========== MOVIMENTAÇÕES DE ESTOQUE ==========

  async createStockMove(data: CreateStockMoveData) {
    return customAxiosInstance<StockMove>({
      url: `${BASE_URL}/stock/movements`,
      method: 'POST',
      data,
    });
  },

  async getStockMoves(params?: StockMoveFilters) {
    return customAxiosInstance<StockMove[]>({
      url: `${BASE_URL}/stock/movements`,
      method: 'GET',
      params,
    });
  },
};
