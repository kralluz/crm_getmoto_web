import { defineConfig } from 'orval';

export default defineConfig({
  'crm-api': {
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customAxiosInstance',
        },
      },
    },
    input: {
      // Aponta para o swagger-output.json da API
      target: '../crm_getmoto_api/src/swagger-output.json',
    },
  },
});
