import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { StorageService } from '../services';
import type { LoginCredentials, RegisterData } from '../types/auth';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      // Salvar access token no storage
      StorageService.setAuthToken(data.token);
      StorageService.setUserData(data.user);

      // Salvar refresh token no localStorage (se existir)
      if ('refreshToken' in data && data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }

      // Atualizar cache
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (data) => {
      // Salvar access token no storage
      StorageService.setAuthToken(data.token);
      StorageService.setUserData(data.user);

      // Salvar refresh token no localStorage (se existir)
      if ('refreshToken' in data && data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }

      // Atualizar cache
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    enabled: !!StorageService.getAuthToken(),
    retry: false,
    // Não refazer a query em erros de autenticação
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    // Manter em cache por MUITO mais tempo para evitar requests desnecessárias
    staleTime: 30 * 60 * 1000, // 30 minutos - dados do usuário raramente mudam
    gcTime: 60 * 60 * 1000, // 60 minutos (anteriormente cacheTime)
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        return authApi.logout();
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      // Limpar storage (access token e user data)
      StorageService.clearAuthData();

      // Limpar refresh token
      localStorage.removeItem('refresh_token');

      // Limpar store Zustand
      try {
        const { useAuthStore } = require('../store/auth-store');
        useAuthStore.getState().logout();
      } catch (error) {
        console.error('Error clearing auth store:', error);
      }

      // Limpar cache do React Query
      queryClient.clear();
    },
    onError: () => {
      // Mesmo se o logout falhar no backend, limpar dados localmente
      StorageService.clearAuthData();
      localStorage.removeItem('refresh_token');
      
      try {
        const { useAuthStore } = require('../store/auth-store');
        useAuthStore.getState().logout();
      } catch (error) {
        console.error('Error clearing auth store:', error);
      }
      
      queryClient.clear();
    },
  });
}
