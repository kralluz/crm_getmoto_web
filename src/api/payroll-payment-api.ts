import { customAxiosInstance } from './axios-instance';
import type {
  PayrollPayment,
  CreatePayrollPaymentData,
  CancelPaymentData,
  PaidPeriod,
} from '../types/payroll-payment';

export const payrollPaymentApi = {
  // Listar pagamentos
  getAll: async (params?: { employee_id?: number }) => {
    const response = await customAxiosInstance<PayrollPayment[]>({
      url: '/api/payroll-payments',
      method: 'GET',
      params,
    });
    return response;
  },

  // Obter pagamento por ID
  getById: async (id: string | number) => {
    const response = await customAxiosInstance<PayrollPayment>({
      url: `/api/payroll-payments/${id}`,
      method: 'GET',
    });
    return response;
  },

  // Criar pagamento
  create: async (data: CreatePayrollPaymentData) => {
    const response = await customAxiosInstance<PayrollPayment>({
      url: '/api/payroll-payments',
      method: 'POST',
      data,
    });
    return response;
  },

  // Cancelar pagamento (com reversão de cash flow e vales)
  cancel: async (id: string | number, data: CancelPaymentData) => {
    const response = await customAxiosInstance<PayrollPayment>({
      url: `/api/payroll-payments/${id}/cancel`,
      method: 'POST',
      data,
    });
    return response;
  },

  // Obter períodos já pagos de um funcionário
  getPaidPeriods: async (employee_id: number) => {
    const response = await customAxiosInstance<PaidPeriod[]>({
      url: `/api/payroll-payments/paid-periods/${employee_id}`,
      method: 'GET',
    });
    return response;
  },
};
