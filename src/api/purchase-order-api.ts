import { customAxiosInstance } from './axios-instance';
import type {
  PurchaseOrder,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  CancelPurchaseOrderData,
} from '../types/purchase-order';

export const purchaseOrderApi = {
  // Criar ordem de compra
  create: async (data: CreatePurchaseOrderData) => {
    const response = await customAxiosInstance<PurchaseOrder>({
      url: '/api/purchase-orders',
      method: 'POST',
      data,
    });
    return response;
  },

  // Listar ordens de compra
  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await customAxiosInstance<PurchaseOrder[]>({
      url: '/api/purchase-orders',
      method: 'GET',
      params,
    });
    return response;
  },

  // Obter ordem de compra por ID
  getById: async (id: string | number) => {
    const response = await customAxiosInstance<PurchaseOrder>({
      url: `/api/purchase-orders/${id}`,
      method: 'GET',
    });
    return response;
  },

  // Atualizar ordem de compra
  update: async (id: string | number, data: UpdatePurchaseOrderData) => {
    const response = await customAxiosInstance<PurchaseOrder>({
      url: `/api/purchase-orders/${id}`,
      method: 'PUT',
      data,
    });
    return response;
  },

  // Deletar ordem de compra (soft delete)
  delete: async (id: string | number) => {
    await customAxiosInstance({
      url: `/api/purchase-orders/${id}`,
      method: 'DELETE',
    });
  },

  // Cancelar ordem de compra (com estorno automático)
  cancel: async (id: string | number, data: CancelPurchaseOrderData) => {
    const response = await customAxiosInstance({
      url: `/api/purchase-orders/${id}/cancel`,
      method: 'POST',
      data,
    });
    return response;
  },

  // Atualizar apenas as observações de uma ordem de compra
  updateNotes: async (id: string | number, notes: string | null) => {
    const response = await customAxiosInstance<PurchaseOrder>({
      url: `/api/purchase-orders/${id}/notes`,
      method: 'PATCH',
      data: { notes },
    });
    return response;
  },
};
