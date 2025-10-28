/**
 * Helper para validação Zod integrado com Axios
 *
 * Este módulo fornece utilitários para validar requests e responses
 * usando schemas Zod, garantindo type safety em runtime.
 */

import { z, ZodError, ZodSchema } from 'zod';
import type { AxiosResponse } from 'axios';

/**
 * Erro de validação customizado
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public zodError: ZodError,
    public data: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  /**
   * Retorna erros formatados para exibição
   */
  getFormattedErrors(): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const issue of this.zodError.issues) {
      const path = issue.path.join('.');
      if (!formatted[path]) {
        formatted[path] = [];
      }
      formatted[path].push(issue.message);
    }

    return formatted;
  }

  /**
   * Retorna primeira mensagem de erro
   */
  getFirstError(): string {
    return this.zodError.issues[0]?.message || 'Erro de validação';
  }
}

/**
 * Valida dados com um schema Zod
 *
 * @example
 * ```typescript
 * import { validate } from '@/api/zod-validator';
 * import { userSchema } from '@/api/generated/zod/schemas';
 *
 * const user = validate(userSchema, userData);
 * ```
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(
      'Erro de validação dos dados',
      result.error,
      data
    );
  }

  return result.data;
}

/**
 * Valida response do Axios com schema Zod
 *
 * @example
 * ```typescript
 * import { validateResponse } from '@/api/zod-validator';
 * import { userSchema } from '@/api/generated/zod/schemas';
 *
 * const response = await axios.get('/api/users/1');
 * const user = validateResponse(userSchema, response);
 * ```
 */
export function validateResponse<T>(
  schema: ZodSchema<T>,
  response: AxiosResponse
): T {
  try {
    return validate(schema, response.data);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('❌ Response validation failed:', {
        url: response.config.url,
        status: response.status,
        errors: error.getFormattedErrors(),
        data: response.data,
      });
    }
    throw error;
  }
}

/**
 * Valida request body antes de enviar
 *
 * @example
 * ```typescript
 * import { validateRequestBody } from '@/api/zod-validator';
 * import { createProductBodySchema } from '@/api/generated/zod/schemas';
 *
 * const validatedData = validateRequestBody(createProductBodySchema, formData);
 * await axios.post('/api/products', validatedData);
 * ```
 */
export function validateRequestBody<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  try {
    return validate(schema, data);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('❌ Request body validation failed:', {
        errors: error.getFormattedErrors(),
        data,
      });
    }
    throw error;
  }
}

/**
 * Valida array de dados
 *
 * @example
 * ```typescript
 * import { validateArray } from '@/api/zod-validator';
 * import { userSchema } from '@/api/generated/zod/schemas';
 *
 * const users = validateArray(userSchema, usersData);
 * ```
 */
export function validateArray<T>(
  itemSchema: ZodSchema<T>,
  data: unknown
): T[] {
  const arraySchema = z.array(itemSchema);
  return validate(arraySchema, data);
}

/**
 * Wrapper para axios instance com validação automática
 *
 * @example
 * ```typescript
 * import { createValidatedAxios } from '@/api/zod-validator';
 * import { userSchema } from '@/api/generated/zod/schemas';
 * import { customAxiosInstance } from '@/api/axios-instance';
 *
 * const getUser = async (id: number) => {
 *   return createValidatedAxios(userSchema)(
 *     customAxiosInstance({
 *       url: `/api/users/${id}`,
 *       method: 'GET',
 *     })
 *   );
 * };
 * ```
 */
export function createValidatedAxios<T>(schema: ZodSchema<T>) {
  return async (promise: Promise<AxiosResponse>): Promise<T> => {
    const response = await promise;
    return validateResponse(schema, response);
  };
}

/**
 * Safe parse - não lança erro, retorna objeto com success/error
 *
 * @example
 * ```typescript
 * import { safeParse } from '@/api/zod-validator';
 * import { userSchema } from '@/api/generated/zod/schemas';
 *
 * const result = safeParse(userSchema, userData);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.getFormattedErrors());
 * }
 * ```
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: new ValidationError('Erro de validação dos dados', result.error, data),
  };
}

/**
 * Partial schema - torna todos os campos opcionais
 *
 * @example
 * ```typescript
 * import { createPartialSchema } from '@/api/zod-validator';
 * import { userSchema } from '@/api/generated/zod/schemas';
 *
 * const partialUserSchema = createPartialSchema(userSchema);
 * const partialUser = validate(partialUserSchema, { name: 'João' });
 * ```
 */
export function createPartialSchema<T>(schema: ZodSchema<T>): ZodSchema<Partial<T>> {
  if (schema instanceof z.ZodObject) {
    return schema.partial();
  }
  throw new Error('Schema must be a ZodObject to create partial');
}
