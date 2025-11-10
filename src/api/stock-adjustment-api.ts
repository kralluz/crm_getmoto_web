import { customAxiosInstance } from './axios-instance';
import type {
  StockAdjustment,
  CreateStockAdjustmentData,
} from '../types/stock-adjustment';

export const stockAdjustmentApi = {
  // Criar ajuste de estoque
  create: async (data: CreateStockAdjustmentData) => {
    const response = await customAxiosInstance<StockAdjustment>({
      url: '/api/stock-adjustments',
      method: 'POST',
      data,
    });
    return response;
  },

  // Listar ajustes
  getAll: async (params?: {
    product_id?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await customAxiosInstance<StockAdjustment[]>({
      url: '/api/stock-adjustments',
      method: 'GET',
      params,
    });
    return response;
  },

  // Obter ajuste por ID
  getById: async (id: string | number) => {
    const response = await customAxiosInstance<StockAdjustment>({
      url: `/api/stock-adjustments/${id}`,
      method: 'GET',
    });
    return response;
  },

  // Deletar ajuste (soft delete)
  delete: async (id: string | number) => {
    await customAxiosInstance({
      url: `/api/stock-adjustments/${id}`,
      method: 'DELETE',
    });
  },

  // Obter ajustes de um produto específico
  getByProduct: async (productId: number) => {
    const response = await customAxiosInstance<StockAdjustment[]>({
      url: `/api/stock-adjustments/product/${productId}`,
      method: 'GET',
    });
    return response;
  },
};
