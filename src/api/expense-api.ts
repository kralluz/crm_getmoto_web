import { customAxiosInstance } from './axios-instance';
import type {
  Expense,
  CreateExpenseData,
  UpdateExpenseData,
  CancelExpenseData,
} from '../types/expense';

export const expenseApi = {
  // Criar despesa
  create: async (data: CreateExpenseData) => {
    const response = await customAxiosInstance<Expense>({
      url: '/api/expenses',
      method: 'POST',
      data,
    });
    return response;
  },

  // Listar despesas
  getAll: async (params?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await customAxiosInstance<Expense[]>({
      url: '/api/expenses',
      method: 'GET',
      params,
    });
    return response;
  },

  // Obter despesa por ID
  getById: async (id: string | number) => {
    const response = await customAxiosInstance<Expense>({
      url: `/api/expenses/${id}`,
      method: 'GET',
    });
    return response;
  },

  // Atualizar despesa
  update: async (id: string | number, data: UpdateExpenseData) => {
    const response = await customAxiosInstance<Expense>({
      url: `/api/expenses/${id}`,
      method: 'PUT',
      data,
    });
    return response;
  },

  // Deletar despesa (soft delete)
  delete: async (id: string | number) => {
    await customAxiosInstance({
      url: `/api/expenses/${id}`,
      method: 'DELETE',
    });
  },

  // Cancelar despesa (com estorno automático)
  cancel: async (id: string | number, data: CancelExpenseData) => {
    const response = await customAxiosInstance({
      url: `/api/expenses/${id}/cancel`,
      method: 'POST',
      data,
    });
    return response;
  },
};
