import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { StorageService } from '../services';
import type { LoginCredentials, RegisterData } from '../types/auth';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      // Salvar token no storage
      StorageService.setAuthToken(data.token);
      StorageService.setUserData(data.user);

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
      // Salvar token no storage
      StorageService.setAuthToken(data.token);
      StorageService.setUserData(data.user);

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
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Limpar storage
      StorageService.clearAuthData();

      // Limpar cache
      queryClient.clear();
    },
  });
}
