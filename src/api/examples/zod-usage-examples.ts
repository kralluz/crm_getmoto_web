/**
 * EXEMPLOS DE USO DA VALIDAÇÃO ZOD
 *
 * Este arquivo demonstra como usar validação Zod runtime
 * com os endpoints gerados pelo Orval.
 *
 * NÃO IMPORTAR ESTE ARQUIVO EM PRODUÇÃO - É APENAS PARA REFERÊNCIA
 */

import { customAxiosInstance } from '../axios-instance';
import {
  validate,
  validateResponse,
  validateRequestBody,
  validateArray,
  safeParse,
  createValidatedAxios,
} from '../zod-validator';
import {
  userSchema,
  productSchema,
  loginBodySchema,
  createProductBodySchema,
  registerBodySchema,
} from '../generated/zod/schemas';

// ============================================
// EXEMPLO 1: Validar dados de formulário antes de enviar
// ============================================

export async function exampleValidateFormData() {
  const formData = {
    email: 'usuario@example.com',
    password: '123456',
  };

  try {
    // Valida antes de enviar
    const validatedData = validateRequestBody(loginBodySchema, formData);

    // Agora pode enviar com segurança
    const response = await customAxiosInstance({
      url: '/api/auth/login',
      method: 'POST',
      data: validatedData,
    });

    console.log('✅ Login realizado:', response.data);
  } catch (error) {
    console.error('❌ Erro de validação:', error);
  }
}

// ============================================
// EXEMPLO 2: Validar response da API
// ============================================

export async function exampleValidateResponse() {
  try {
    const response = await customAxiosInstance({
      url: '/api/users/1',
      method: 'GET',
    });

    // Valida a response
    const user = validateResponse(userSchema, response);

    console.log('✅ Usuário validado:', user);
    // user agora tem tipagem completa E foi validado em runtime!

    return user;
  } catch (error) {
    console.error('❌ Response inválida:', error);
    throw error;
  }
}

// ============================================
// EXEMPLO 3: Validar array de dados
// ============================================

export async function exampleValidateArray() {
  try {
    const response = await customAxiosInstance({
      url: '/api/products',
      method: 'GET',
    });

    // Valida array de produtos
    const products = validateArray(productSchema, response.data);

    console.log(`✅ ${products.length} produtos validados`);

    return products;
  } catch (error) {
    console.error('❌ Array inválido:', error);
    throw error;
  }
}

// ============================================
// EXEMPLO 4: Safe parse (não lança erro)
// ============================================

export function exampleSafeParse(userData: unknown) {
  const result = safeParse(userSchema, userData);

  if (result.success) {
    console.log('✅ Dados válidos:', result.data);
    return result.data;
  } else {
    console.log('❌ Dados inválidos:');
    const errors = result.error.getFormattedErrors();

    // Exibir erros formatados
    Object.entries(errors).forEach(([field, messages]) => {
      console.log(`  ${field}:`, messages.join(', '));
    });

    return null;
  }
}

// ============================================
// EXEMPLO 5: Wrapper de axios com validação automática
// ============================================

export async function exampleValidatedAxios() {
  const getValidatedUser = createValidatedAxios(userSchema);

  try {
    const user = await getValidatedUser(
      customAxiosInstance({
        url: '/api/users/1',
        method: 'GET',
      })
    );

    console.log('✅ Usuário validado automaticamente:', user);
    return user;
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

// ============================================
// EXEMPLO 6: Validação de formulário completo
// ============================================

export async function exampleFormValidation() {
  // Dados do formulário (podem vir de um form React)
  const formData = {
    name: 'Produto Teste',
    description: 'Descrição do produto',
    code: 'PROD001',
    barcode: '1234567890123',
    brand: 'Marca X',
    cost_price_cents: 5000, // R$ 50,00
    sale_price_cents: 8000, // R$ 80,00
    stock_quantity: 10,
    min_stock: 2,
    unit: 'UN',
    category_id: 1,
    is_active: true,
  };

  // Validar
  const result = safeParse(createProductBodySchema, formData);

  if (!result.success) {
    // Mostrar erros no formulário
    const errors = result.error.getFormattedErrors();
    console.error('Erros de validação:', errors);

    // Exemplo de como usar no React:
    // setFormErrors(errors);
    return;
  }

  // Dados válidos, pode enviar
  try {
    const response = await customAxiosInstance({
      url: '/api/products',
      method: 'POST',
      data: result.data,
    });

    console.log('✅ Produto criado:', response.data);
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
  }
}

// ============================================
// EXEMPLO 7: Hook React com validação Zod
// ============================================

/**
 * Exemplo de hook React Query com validação Zod
 *
 * ```typescript
 * import { useQuery } from '@tanstack/react-query';
 * import { customAxiosInstance } from '@/api/axios-instance';
 * import { validateResponse } from '@/api/zod-validator';
 * import { productSchema } from '@/api/generated/zod/schemas';
 *
 * export const useProduct = (id: number) => {
 *   return useQuery({
 *     queryKey: ['products', id],
 *     queryFn: async () => {
 *       const response = await customAxiosInstance({
 *         url: `/api/products/${id}`,
 *         method: 'GET',
 *       });
 *
 *       // Validar response antes de retornar
 *       return validateResponse(productSchema, response);
 *     },
 *   });
 * };
 * ```
 */

// ============================================
// EXEMPLO 8: Validação com transformação de dados
// ============================================

export async function exampleDataTransformation() {
  // Backend retorna cents, frontend precisa de reais
  const productData = {
    product_id: 1,
    name: 'Produto',
    cost_price_cents: 5000,
    sale_price_cents: 8000,
  };

  // Validar
  const validatedProduct = validate(productSchema, productData);

  // Transformar para exibição
  const displayProduct = {
    ...validatedProduct,
    cost_price: validatedProduct.cost_price_cents! / 100,
    sale_price: validatedProduct.sale_price_cents! / 100,
  };

  console.log('Produto formatado:', displayProduct);
  // { name: 'Produto', cost_price: 50.00, sale_price: 80.00 }
}

// ============================================
// EXEMPLO 9: Validação de múltiplas responses
// ============================================

export async function exampleMultipleValidations() {
  try {
    // Buscar dados em paralelo
    const [usersResponse, productsResponse] = await Promise.all([
      customAxiosInstance({ url: '/api/users', method: 'GET' }),
      customAxiosInstance({ url: '/api/products', method: 'GET' }),
    ]);

    // Validar cada response
    const users = validateArray(userSchema, usersResponse.data);
    const products = validateArray(productSchema, productsResponse.data);

    console.log(`✅ Validados: ${users.length} usuários, ${products.length} produtos`);

    return { users, products };
  } catch (error) {
    console.error('❌ Erro na validação:', error);
    throw error;
  }
}

// ============================================
// EXEMPLO 10: Tratamento de erros de validação
// ============================================

export function exampleErrorHandling(data: unknown) {
  try {
    const user = validate(userSchema, data);
    return { success: true, user };
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      // Erro de validação Zod
      const validationError = error as any;

      console.error('Erros de validação:');

      // Pegar erros formatados
      const formatted = validationError.getFormattedErrors();

      // Mostrar no console de forma legível
      Object.entries(formatted).forEach(([field, messages]) => {
        console.error(`  - ${field}: ${(messages as string[]).join(', ')}`);
      });

      // Ou pegar primeiro erro para toast/notification
      const firstError = validationError.getFirstError();
      console.error(`Primeiro erro: ${firstError}`);

      return { success: false, error: formatted };
    }

    // Outro tipo de erro
    console.error('Erro desconhecido:', error);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ============================================
// RESUMO DE BENEFÍCIOS
// ============================================

/**
 * BENEFÍCIOS DA VALIDAÇÃO ZOD:
 *
 * 1. ✅ Type Safety em Runtime
 *    - TypeScript valida em compile time
 *    - Zod valida em runtime (dados da API)
 *
 * 2. ✅ Detecção Precoce de Erros
 *    - Pega dados inválidos antes de processar
 *    - Evita bugs silenciosos
 *
 * 3. ✅ Mensagens de Erro Claras
 *    - Erros detalhados e formatados
 *    - Fácil de mostrar no UI
 *
 * 4. ✅ Validação de Formulários
 *    - Valida input do usuário antes de enviar
 *    - Integra facilmente com React Hook Form
 *
 * 5. ✅ Transformação de Dados
 *    - Pode transformar dados durante validação
 *    - Ex: parse de datas, conversão de tipos
 *
 * 6. ✅ Documentação Viva
 *    - Schemas servem como documentação
 *    - Sempre sincronizados com o código
 *
 * 7. ✅ Compatível com TypeScript
 *    - Infere tipos automaticamente
 *    - Não precisa duplicar definições
 */
