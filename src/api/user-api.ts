import { customAxiosInstance } from './axios-instance';
import type { User, CreateUserInput, UpdateUserInput, ChangePasswordInput } from '../types/user';

const BASE_URL = '/api/users';

export const userApi = {
  async getAll(params?: { active?: boolean; role?: string }) {
    return customAxiosInstance<User[]>({
      url: BASE_URL,
      method: 'GET',
      params,
    });
  },

  async getById(id: string) {
    return customAxiosInstance<User>({
      url: `${BASE_URL}/${id}`,
      method: 'GET',
    });
  },

  async create(data: CreateUserInput) {
    return customAxiosInstance<User>({
      url: BASE_URL,
      method: 'POST',
      data,
    });
  },

  async update(id: string, data: UpdateUserInput) {
    return customAxiosInstance<User>({
      url: `${BASE_URL}/${id}`,
      method: 'PUT',
      data,
    });
  },

  async delete(id: string) {
    return customAxiosInstance<void>({
      url: `${BASE_URL}/${id}`,
      method: 'DELETE',
    });
  },

  async changePassword(id: string, data: ChangePasswordInput) {
    return customAxiosInstance<void>({
      url: `${BASE_URL}/${id}/password`,
      method: 'PUT',
      data,
    });
  },
};
