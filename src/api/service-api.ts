import { customAxiosInstance } from './axios-instance';
import type { 
  ServiceOrder, 
  CreateServiceOrderData, 
  UpdateServiceOrderData,
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

  async update(id: number, data: UpdateServiceOrderData) {
    return customAxiosInstance<ServiceOrder>({
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
};
