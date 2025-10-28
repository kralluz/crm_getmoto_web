import { defineConfig } from 'orval';

export default defineConfig({
  'crm-api': {
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      mock: false,
      // Habilitar geração de schemas Zod
      zod: true,
      // Configuração avançada do Orval
      prettier: true,
      tsconfig: './tsconfig.json',
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customAxiosInstance',
        },
        // Configurações de query para React Query
        query: {
          useQuery: true,
          useMutation: true,
          // Opções padrão de cache
          options: {
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
          },
        },
      },
    },
    input: {
      // Aponta para o swagger-output.json da API (copiado para o frontend)
      target: './swagger-output.json',
      // Desabilitar validação estrita (warnings do IBM OpenAPI Validator)
      validation: false,
      override: {
        // Transformações customizadas
        transformer: undefined,
      },
    },
  },
});
