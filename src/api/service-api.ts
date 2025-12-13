import { customAxiosInstance } from './axios-instance';
import type {
  ServiceOrder,
  CreateServiceOrderData,
  ServiceOrderListParams
} from '../types/service-order';

const BASE_URL = '/api/services';

export const serviceOrderApi = {
  async getAll(params?: ServiceOrderListParams) {
    return customAxiosInstance<ServiceOrder[]>({
      url: BASE_URL,
      method: 'GET',
      params,
      skipErrorNotification: true,
    });
  },

  async getById(id: number) {
    return customAxiosInstance<ServiceOrder>({
      url: `${BASE_URL}/${id}`,
      method: 'GET',
      skipErrorNotification: true,
    });
  },

  async create(data: CreateServiceOrderData) {
    return customAxiosInstance<ServiceOrder>({
      url: BASE_URL,
      method: 'POST',
      data,
    });
  },

  /**
   * Cancela uma ordem de serviço com estorno automático
   * Ordens de serviço são imutáveis - não podem ser editadas, apenas canceladas
   */
  async cancel(id: number, data: { cancelled_by: number; cancellation_reason: string }) {
    return customAxiosInstance<ServiceOrder>({
      url: `${BASE_URL}/${id}/cancel`,
      method: 'POST',
      data,
    });
  },

  /**
   * Atualiza apenas as observações de uma ordem de serviço
   * Única exceção à regra de imutabilidade, pois observações são apenas informativas
   */
  async updateNotes(id: number, notes: string | null) {
    return customAxiosInstance<ServiceOrder>({
      url: `${BASE_URL}/${id}/notes`,
      method: 'PATCH',
      data: { notes },
    });
  },

  /**
   * Atualiza apenas a descrição do serviço de uma ordem de serviço
   */
  async updateDescription(id: number, service_description: string | null) {
    return customAxiosInstance<ServiceOrder>({
      url: `${BASE_URL}/${id}/description`,
      method: 'PATCH',
      data: { service_description },
    });
  },

  async delete(id: number) {
    return customAxiosInstance<void>({
      url: `${BASE_URL}/${id}`,
      method: 'DELETE',
    });
  },

  async getByStatus(status: string) {
    return customAxiosInstance<ServiceOrder[]>({
      url: BASE_URL,
      method: 'GET',
      params: { status },
    });
  },

  async getByCustomer(customer_name: string) {
    return customAxiosInstance<ServiceOrder[]>({
      url: BASE_URL,
      method: 'GET',
      params: { customer_name },
    });
  },
}