import { customAxiosInstance } from './axios-instance';
import type {
  TimeEntry,
  CreateTimeEntryData,
  UpdateTimeEntryData,
  WeeklySummary,
} from '../types/time-entry';

export const timeEntryApi = {
  // Listar registros de horário
  getAll: async (params?: { employee_id?: number; start_date?: string; end_date?: string }) => {
    const response = await customAxiosInstance<TimeEntry[]>({
      url: '/api/time-entries',
      method: 'GET',
      params,
    });
    return response;
  },

  // Obter registro por ID
  getById: async (id: string | number) => {
    const response = await customAxiosInstance<TimeEntry>({
      url: `/api/time-entries/${id}`,
      method: 'GET',
    });
    return response;
  },

  // Obter resumo semanal de um funcionário
  getWeeklySummary: async (
    employee_id: number,
    week_start: string,
    week_end: string
  ) => {
    const response = await customAxiosInstance<WeeklySummary>({
      url: `/api/time-entries/employee/${employee_id}/weekly`,
      method: 'GET',
      params: { week_start, week_end },
    });
    return response;
  },

  // Criar registro (clock in/out)
  create: async (data: CreateTimeEntryData) => {
    const response = await customAxiosInstance<TimeEntry>({
      url: '/api/time-entries',
      method: 'POST',
      data,
    });
    return response;
  },

  // Atualizar registro (geralmente clock out)
  update: async (id: string | number, data: UpdateTimeEntryData) => {
    const response = await customAxiosInstance<TimeEntry>({
      url: `/api/time-entries/${id}`,
      method: 'PUT',
      data,
    });
    return response;
  },

  // Deletar registro (soft delete)
  delete: async (id: string | number) => {
    await customAxiosInstance({
      url: `/api/time-entries/${id}`,
      method: 'DELETE',
    });
  },
};
