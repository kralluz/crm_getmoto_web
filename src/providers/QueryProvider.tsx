import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

// Configuração do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Retry apenas para erros de rede, não para erros 4xx/5xx
      retry: (failureCount, error: any) => {
        // Não retentar erros de autenticação
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Não retentar erros do cliente (4xx)
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retentar apenas 1 vez para outros erros
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
