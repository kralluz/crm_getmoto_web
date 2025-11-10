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
    // Manter em cache por mais tempo para evitar requests desnecessárias
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos (anteriormente cacheTime)
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Limpar storage (access token e user data)
      StorageService.clearAuthData();

      // Limpar refresh token
      localStorage.removeItem('refresh_token');

      // Limpar cache do React Query
      queryClient.clear();
    },
  });
}
