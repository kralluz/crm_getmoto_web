import { customAxiosInstance } from './axios-instance';
import type {
  Employee,
  CreateEmployeeData,
  UpdateEmployeeData,
} from '../types/employee';

export const employeeApi = {
  // Listar funcionários
  getAll: async (params?: { is_active?: boolean }) => {
    const response = await customAxiosInstance<Employee[]>({
      url: '/api/employees',
      method: 'GET',
      params,
    });
    return response;
  },

  // Obter funcionário por ID
  getById: async (id: string | number) => {
    const response = await customAxiosInstance<Employee>({
      url: `/api/employees/${id}`,
      method: 'GET',
    });
    return response;
  },

  // Criar funcionário
  create: async (data: CreateEmployeeData) => {
    const response = await customAxiosInstance<Employee>({
      url: '/api/employees',
      method: 'POST',
      data,
    });
    return response;
  },

  // Atualizar funcionário
  update: async (id: string | number, data: UpdateEmployeeData) => {
    const response = await customAxiosInstance<Employee>({
      url: `/api/employees/${id}`,
      method: 'PUT',
      data,
    });
    return response;
  },

  // Desabilitar funcionário (soft delete)
  disable: async (id: string | number) => {
    const response = await customAxiosInstance<Employee>({
      url: `/api/employees/${id}/disable`,
      method: 'PATCH',
    });
    return response;
  },

  // Habilitar funcionário
  enable: async (id: string | number) => {
    const response = await customAxiosInstance<Employee>({
      url: `/api/employees/${id}/enable`,
      method: 'PATCH',
    });
    return response;
  },
};
