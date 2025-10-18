import { customAxiosInstance } from './axios-instance';
import type {
  CashFlowSummary,
  CategorySummary,
  CashFlowTransaction,
  CreateTransactionData,
} from '../types/cashflow';

export const cashFlowApi = {
  // Obter resumo financeiro
  getSummary: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await customAxiosInstance<CashFlowSummary>({
      url: '/api/cashflow/summary',
      method: 'GET',
      params,
    });
    return response;
  },

  // Obter resumo por categorias
  getCategorySummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await customAxiosInstance<CategorySummary[]>({
      url: '/api/cashflow/summary/categories',
      method: 'GET',
      params,
    });
    return response;
  },

  // Listar transações
  getTransactions: async (params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await customAxiosInstance<CashFlowTransaction[]>({
      url: '/api/cashflow',
      method: 'GET',
      params,
    });
    return response;
  },

  // Criar transação
  createTransaction: async (data: CreateTransactionData) => {
    const response = await customAxiosInstance<CashFlowTransaction>({
      url: '/api/cashflow',
      method: 'POST',
      data,
    });
    return response;
  },

  // Obter transação por ID
  getTransactionById: async (id: string) => {
    const response = await customAxiosInstance<CashFlowTransaction>({
      url: `/api/cashflow/${id}`,
      method: 'GET',
    });
    return response;
  },

  // Atualizar transação
  updateTransaction: async (id: string, data: Partial<CreateTransactionData>) => {
    const response = await customAxiosInstance<CashFlowTransaction>({
      url: `/api/cashflow/${id}`,
      method: 'PUT',
      data,
    });
    return response;
  },

  // Deletar transação
  deleteTransaction: async (id: string) => {
    await customAxiosInstance({
      url: `/api/cashflow/${id}`,
      method: 'DELETE',
    });
  },
};
