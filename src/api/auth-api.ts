import { customAxiosInstance } from './axios-instance';
import type { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';
import type { User } from '../types/user';

const BASE_URL = '/api/auth';

/**
 * Normaliza resposta do backend convertendo user_id para id
 */
const normalizeAuthResponse = (response: any): AuthResponse => {
  if (response.user && response.user.user_id) {
    response.user.id = String(response.user.user_id);
  }
  return response;
};

export const authApi = {
  async login(credentials: LoginCredentials) {
    const response = await customAxiosInstance<any>({
      url: `${BASE_URL}/login`,
      method: 'POST',
      data: credentials,
    });
    return normalizeAuthResponse(response);
  },

  async register(data: RegisterData) {
    const response = await customAxiosInstance<any>({
      url: `${BASE_URL}/register`,
      method: 'POST',
      data,
    });
    return normalizeAuthResponse(response);
  },

  async me() {
    const response = await customAxiosInstance<any>({
      url: `${BASE_URL}/me`,
      method: 'GET',
    });
    
    // Normaliza user_id para id
    if (response.user_id) {
      response.id = String(response.user_id);
    }
    
    return response as User;
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
