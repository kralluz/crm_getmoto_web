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
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      // Chama backend para invalidar refresh token
      try {
        await customAxiosInstance({
          url: `${BASE_URL}/logout`,
          method: 'POST',
          data: { refreshToken },
        });
      } catch (error) {
        // Ignora erro de logout (pode estar offline ou token já expirado)
        console.warn('Logout request failed, but clearing local data anyway', error);
      }
    }

    // Limpa dados locais independente do resultado da chamada
    return Promise.resolve();
  },
};
