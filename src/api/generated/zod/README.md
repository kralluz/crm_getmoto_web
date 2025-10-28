# Validação Zod - CRM GetMoto

## 📖 Visão Geral

Este diretório contém schemas Zod para validação runtime dos modelos da API.

**Por que usar Zod?**
- ✅ **Type Safety em Runtime**: TypeScript valida em compile-time, Zod valida em runtime
- ✅ **Validação de API Responses**: Garante que dados da API são válidos
- ✅ **Validação de Formulários**: Valida input do usuário antes de enviar
- ✅ **Mensagens de Erro Claras**: Erros detalhados e fáceis de mostrar no UI
- ✅ **Zero Duplicação**: Infere tipos TypeScript automaticamente

## 🚀 Quick Start

### 1. Validar Response da API

```typescript
import { validateResponse } from '@/api/zod-validator';
import { userSchema } from '@/api/generated/zod/schemas';
import { customAxiosInstance } from '@/api/axios-instance';

const response = await customAxiosInstance({
  url: '/api/users/1',
  method: 'GET',
});

// Valida e retorna tipado
const user = validateResponse(userSchema, response);
```

### 2. Validar Request Body (Formulário)

```typescript
import { validateRequestBody } from '@/api/zod-validator';
import { createProductBodySchema } from '@/api/generated/zod/schemas';

const formData = {
  name: 'Produto Teste',
  cost_price_cents: 5000,
  sale_price_cents: 8000,
  // ...
};

// Valida antes de enviar
const validatedData = validateRequestBody(createProductBodySchema, formData);

await customAxiosInstance({
  url: '/api/products',
  method: 'POST',
  data: validatedData,
});
```

### 3. Safe Parse (não lança erro)

```typescript
import { safeParse } from '@/api/zod-validator';
import { userSchema } from '@/api/generated/zod/schemas';

const result = safeParse(userSchema, userData);

if (result.success) {
  console.log('Dados válidos:', result.data);
} else {
  // Mostra erros no formulário
  const errors = result.error.getFormattedErrors();
  // { "email": ["Email inválido"], "password": ["Senha muito curta"] }
}
```

### 4. Validar Array de Dados

```typescript
import { validateArray } from '@/api/zod-validator';
import { productSchema } from '@/api/generated/zod/schemas';

const response = await customAxiosInstance({
  url: '/api/products',
  method: 'GET',
});

const products = validateArray(productSchema, response.data);
```

## 📚 Schemas Disponíveis

### Enums

- `userRoleSchema` - Roles de usuário (ADMIN, MANAGER, etc.)
- `cashFlowTypeSchema` - Tipo de transação (INCOME, EXPENSE)
- `serviceStatusSchema` - Status de serviço (PENDING, IN_PROGRESS, etc.)
- `stockMovementTypeSchema` - Tipo de movimento de estoque

### Models

- `userSchema` - Usuário
- `productSchema` - Produto
- `serviceSchema` - Ordem de serviço
- `productCategorySchema` - Categoria de produto
- `serviceCategorySchema` - Categoria de serviço
- `vehicleSchema` - Veículo
- `cashFlowSchema` - Fluxo de caixa

### Request Bodies

- `loginBodySchema` - Login
- `registerBodySchema` - Registro de usuário
- `createProductBodySchema` - Criar produto
- `createServiceBodySchema` - Criar serviço
- `stockMovementBodySchema` - Movimento de estoque

## 🔧 Utilitários Disponíveis

### `validate(schema, data)`
Valida dados e lança erro se inválido.

```typescript
const user = validate(userSchema, userData);
```

### `validateResponse(schema, response)`
Valida response do Axios.

```typescript
const user = validateResponse(userSchema, axiosResponse);
```

### `validateRequestBody(schema, data)`
Valida request body antes de enviar.

```typescript
const validData = validateRequestBody(createProductBodySchema, formData);
```

### `validateArray(schema, data)`
Valida array de dados.

```typescript
const users = validateArray(userSchema, usersData);
```

### `safeParse(schema, data)`
Valida sem lançar erro - retorna `{ success, data/error }`.

```typescript
const result = safeParse(userSchema, userData);
if (!result.success) {
  console.log(result.error.getFormattedErrors());
}
```

### `createValidatedAxios(schema)`
Cria wrapper de axios com validação automática.

```typescript
const getUser = createValidatedAxios(userSchema);
const user = await getUser(customAxiosInstance({ url: '/api/users/1' }));
```

### `createPartialSchema(schema)`
Cria schema com todos os campos opcionais (útil para updates).

```typescript
const partialUser = createPartialSchema(userSchema);
```

## 🎯 Uso com React Query

### Hook com Validação

```typescript
import { useQuery } from '@tanstack/react-query';
import { validateResponse } from '@/api/zod-validator';
import { userSchema } from '@/api/generated/zod/schemas';

export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await customAxiosInstance({
        url: `/api/users/${id}`,
        method: 'GET',
      });

      return validateResponse(userSchema, response);
    },
  });
};
```

### Mutation com Validação

```typescript
import { useMutation } from '@tanstack/react-query';
import { validateRequestBody } from '@/api/zod-validator';
import { createProductBodySchema } from '@/api/generated/zod/schemas';

export const useCreateProduct = () => {
  return useMutation({
    mutationFn: async (data: unknown) => {
      // Valida antes de enviar
      const validData = validateRequestBody(createProductBodySchema, data);

      const response = await customAxiosInstance({
        url: '/api/products',
        method: 'POST',
        data: validData,
      });

      return response.data;
    },
  });
};
```

## 🎨 Uso com React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductBodySchema } from '@/api/generated/zod/schemas';

export function ProductForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProductBodySchema),
  });

  const onSubmit = async (data) => {
    // Data já está validado pelo React Hook Form + Zod
    await customAxiosInstance({
      url: '/api/products',
      method: 'POST',
      data,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... */}
    </form>
  );
}
```

## ⚠️ Tratamento de Erros

```typescript
import { ValidationError } from '@/api/zod-validator';

try {
  const user = validate(userSchema, userData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Erros formatados
    const formatted = error.getFormattedErrors();
    // { "email": ["Email inválido"], ... }

    // Primeira mensagem de erro
    const firstError = error.getFirstError();
    // "Email inválido"

    // Erro Zod original
    const zodError = error.zodError;

    // Dados que falharam
    const invalidData = error.data;
  }
}
```

## 🔄 Regenerar Schemas

Para regenerar schemas quando a API mudar:

```bash
# No backend
cd crm_getmoto_api
npm run swagger:jsdoc

# No frontend
cd crm_getmoto_web
cp ../crm_getmoto_api/src/swagger-output.json .
npm run generate:api
```

Os schemas Zod em `schemas.ts` devem ser atualizados manualmente se necessário.

## 📝 Exemplos Completos

Veja exemplos detalhados em:
- `/src/api/examples/zod-usage-examples.ts`

## 🤝 Contribuindo

Ao adicionar novos endpoints:

1. Atualize o Swagger no backend
2. Regenere o cliente Orval
3. Adicione schemas Zod em `schemas.ts` se necessário
4. Adicione testes de validação

## 📖 Documentação Adicional

- [Documentação Zod](https://zod.dev)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [Orval Documentation](https://orval.dev)
