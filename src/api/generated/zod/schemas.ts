/**
 * Schemas Zod para validação runtime
 *
 * Este arquivo contém schemas Zod gerados a partir dos modelos TypeScript.
 * Eles fornecem validação runtime além da tipagem estática do TypeScript.
 *
 * Uso:
 * ```typescript
 * import { userSchema, productSchema } from '@/api/generated/zod/schemas';
 *
 * // Validar dados
 * const result = userSchema.safeParse(data);
 * if (!result.success) {
 *   console.error(result.error);
 * }
 *
 * // Ou com throw
 * const user = userSchema.parse(data);
 * ```
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const userRoleSchema = z.enum(['ADMIN', 'MANAGER', 'MECHANIC', 'ATTENDANT']);

export const cashFlowTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const serviceStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
  'CANCELLED',
]);

export const stockMovementTypeSchema = z.enum([
  'IN',
  'OUT',
  'ADJUSTMENT',
  'RETURN',
  'TRANSFER',
]);

// ============================================
// MODELS
// ============================================

/**
 * Schema de validação para User
 */
export const userSchema = z.object({
  user_id: z.number().int().optional(),
  name: z.string().optional(),
  email: z.string().email().nullable().optional(),
  role: userRoleSchema.nullable().optional(),
  position: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Schema de validação para Product
 */
export const productSchema = z.object({
  product_id: z.number().int().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  cost_price_cents: z.number().int().optional(),
  sale_price_cents: z.number().int().optional(),
  stock_quantity: z.number().int().optional(),
  min_stock: z.number().int().optional(),
  max_stock: z.number().int().nullable().optional(),
  unit: z.string().optional(),
  category_id: z.number().int().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Schema de validação para Service
 */
export const serviceSchema = z.object({
  service_order_id: z.number().int().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().nullable().optional(),
  vehicle_id: z.number().int().nullable().optional(),
  professional_name: z.string().nullable().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  estimated_labor_cost_cents: z.number().int().nullable().optional(),
  category_id: z.number().int().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Schema de validação para ProductCategory
 */
export const productCategorySchema = z.object({
  category_id: z.number().int().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Schema de validação para ServiceCategory
 */
export const serviceCategorySchema = z.object({
  category_id: z.number().int().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Schema de validação para Vehicle
 */
export const vehicleSchema = z.object({
  vehicle_id: z.number().int().optional(),
  customer_id: z.number().int().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  license_plate: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Schema de validação para CashFlow
 */
export const cashFlowSchema = z.object({
  transaction_id: z.number().int().optional(),
  type: cashFlowTypeSchema.optional(),
  category: z.string().optional(),
  amount_cents: z.number().int().optional(),
  description: z.string().nullable().optional(),
  date: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// ============================================
// REQUEST BODIES
// ============================================

/**
 * Schema para login
 */
export const loginBodySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * Schema para registro de usuário
 */
export const registerBodySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: userRoleSchema.default('ATTENDANT'),
  active: z.boolean().default(true).optional(),
});

/**
 * Schema para criar produto
 */
export const createProductBodySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  cost_price_cents: z.number().int().min(0, 'Preço de custo deve ser >= 0'),
  sale_price_cents: z.number().int().min(0, 'Preço de venda deve ser >= 0'),
  stock_quantity: z.number().int().min(0).default(0),
  min_stock: z.number().int().min(0).default(0),
  max_stock: z.number().int().min(0).optional().nullable(),
  unit: z.string().default('UN'),
  category_id: z.number().int().optional().nullable(),
  is_active: z.boolean().default(true),
});

/**
 * Schema para criar serviço
 */
export const createServiceBodySchema = z.object({
  customer_name: z.string().min(3, 'Nome do cliente é obrigatório'),
  customer_phone: z.string().optional().nullable(),
  vehicle_id: z.number().int().optional().nullable(),
  professional_name: z.string().optional().nullable(),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  status: serviceStatusSchema.default('PENDING'),
  estimated_labor_cost_cents: z.number().int().min(0).optional().nullable(),
  category_id: z.number().int().optional().nullable(),
});

/**
 * Schema para movimento de estoque
 */
export const stockMovementBodySchema = z.object({
  product_id: z.number().int(),
  type: stockMovementTypeSchema,
  quantity: z.number().int().min(1, 'Quantidade deve ser maior que 0'),
  notes: z.string().optional().nullable(),
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type UserSchemaType = z.infer<typeof userSchema>;
export type ProductSchemaType = z.infer<typeof productSchema>;
export type ServiceSchemaType = z.infer<typeof serviceSchema>;
export type LoginBodyType = z.infer<typeof loginBodySchema>;
export type RegisterBodyType = z.infer<typeof registerBodySchema>;
export type CreateProductBodyType = z.infer<typeof createProductBodySchema>;
export type CreateServiceBodyType = z.infer<typeof createServiceBodySchema>;
export type StockMovementBodyType = z.infer<typeof stockMovementBodySchema>;
