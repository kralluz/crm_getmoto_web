import { customAxiosInstance } from './axios-instance';
import type { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';
import type { User } from '../types/user';

const BASE_URL = '/api/auth';

export const authApi = {
  async login(credentials: LoginCredentials) {
    return customAxiosInstance<AuthResponse>({
      url: `${BASE_URL}/login`,
      method: 'POST',
      data: credentials,
    });
  },

  async register(data: RegisterData) {
    return customAxiosInstance<AuthResponse>({
      url: `${BASE_URL}/register`,
      method: 'POST',
      data,
    });
  },

  async me() {
    return customAxiosInstance<User>({
      url: `${BASE_URL}/me`,
      method: 'GET',
    });
  },

  async logout() {
    // Limpar token do storage (implementado no hook)
    return Promise.resolve();
  },
};
