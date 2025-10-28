/**
 * EXEMPLO DE HOOK DE AUTENTICAÇÃO COM VALIDAÇÃO ZOD
 *
 * Este arquivo demonstra como integrar validação Zod com React Query
 * para criar hooks type-safe com validação runtime.
 *
 * Este é um exemplo completo e funcional que pode ser usado como referência.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { customAxiosInstance } from '../api/axios-instance';
import {
  validate,
  validateResponse,
  safeParse,
} from '../api/zod-validator';
import {
  loginBodySchema,
  registerBodySchema,
  userSchema,
} from '../api/generated/zod/schemas';
import type { LoginBodyType, RegisterBodyType } from '../api/generated/zod/schemas';

// ============================================
// LOGIN COM VALIDAÇÃO
// ============================================

/**
 * Hook para fazer login com validação Zod
 *
 * @example
 * ```tsx
 * const LoginForm = () => {
 *   const login = useValidatedLogin();
 *
 *   const handleSubmit = async (data) => {
 *     try {
 *       const result = await login.mutateAsync(data);
 *       console.log('Logado:', result.user);
 *     } catch (error) {
 *       // Erros de validação ou de rede
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="email" />
 *       <input name="password" type="password" />
 *       <button disabled={login.isPending}>Login</button>
 *     </form>
 *   );
 * };
 * ```
 */
export const useValidatedLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginBodyType) => {
      // 1. Validar input do usuário ANTES de enviar
      const validatedCredentials = validate(loginBodySchema, credentials);

      // 2. Fazer request
      const response = await customAxiosInstance({
        url: '/api/auth/login',
        method: 'POST',
        data: validatedCredentials,
      });

      // 3. Validar response da API
      // Aqui você validaria com um schema de AuthResponse se tivesse
      // const authData = validateResponse(authResponseSchema, response);

      return response.data;
    },
    onSuccess: (data) => {
      // Salvar token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
    },
    onError: (error: any) => {
      // Tratar erros
      if (error.name === 'ValidationError') {
        console.error('Dados de login inválidos:', error.getFormattedErrors());
      } else {
        console.error('Erro ao fazer login:', error.message);
      }
    },
  });
};

// ============================================
// REGISTRO COM VALIDAÇÃO
// ============================================

/**
 * Hook para registrar usuário com validação Zod
 *
 * @example
 * ```tsx
 * const RegisterForm = () => {
 *   const register = useValidatedRegister();
 *
 *   const handleSubmit = async (formData) => {
 *     // Validar antes de enviar
 *     const result = safeParse(registerBodySchema, formData);
 *
 *     if (!result.success) {
 *       // Mostrar erros no formulário
 *       setErrors(result.error.getFormattedErrors());
 *       return;
 *     }
 *
 *     try {
 *       await register.mutateAsync(result.data);
 *     } catch (error) {
 *       // Erro de rede ou servidor
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * };
 * ```
 */
export const useValidatedRegister = () => {
  return useMutation({
    mutationFn: async (userData: RegisterBodyType) => {
      // Validar
      const validatedData = validate(registerBodySchema, userData);

      // Enviar
      const response = await customAxiosInstance({
        url: '/api/auth/register',
        method: 'POST',
        data: validatedData,
      });

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Usuário registrado:', data);
    },
  });
};

// ============================================
// GET CURRENT USER COM VALIDAÇÃO
// ============================================

/**
 * Hook para buscar dados do usuário logado com validação
 *
 * @example
 * ```tsx
 * const Dashboard = () => {
 *   const { data: user, isLoading, error } = useValidatedCurrentUser();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <div>Bem-vindo, {user?.name}!</div>;
 * };
 * ```
 */
export const useValidatedCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await customAxiosInstance({
        url: '/api/auth/me',
        method: 'GET',
      });

      // Validar response antes de retornar
      const user = validateResponse(userSchema, response);

      return user;
    },
    // Configurações de cache
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    // Só executar se houver token
    enabled: !!localStorage.getItem('token'),
    // Retry apenas em erros de rede (não 401/403)
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

// ============================================
// EXEMPLO DE FORMULÁRIO REACT HOOK FORM + ZOD
// ============================================

/**
 * Exemplo de componente de formulário usando React Hook Form + Zod
 *
 * ```tsx
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { loginBodySchema } from '@/api/generated/zod/schemas';
 *
 * const LoginFormWithValidation = () => {
 *   const login = useValidatedLogin();
 *
 *   const {
 *     register,
 *     handleSubmit,
 *     formState: { errors, isSubmitting },
 *   } = useForm({
 *     resolver: zodResolver(loginBodySchema),
 *     defaultValues: {
 *       email: '',
 *       password: '',
 *     },
 *   });
 *
 *   const onSubmit = async (data) => {
 *     // Data já está validado pelo Zod resolver
 *     try {
 *       await login.mutateAsync(data);
 *       // Redirecionar para dashboard
 *     } catch (error) {
 *       // Mostrar erro
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <div>
 *         <label>Email</label>
 *         <input
 *           {...register('email')}
 *           type="email"
 *           placeholder="seu@email.com"
 *         />
 *         {errors.email && (
 *           <span className="error">{errors.email.message}</span>
 *         )}
 *       </div>
 *
 *       <div>
 *         <label>Senha</label>
 *         <input
 *           {...register('password')}
 *           type="password"
 *           placeholder="******"
 *         />
 *         {errors.password && (
 *           <span className="error">{errors.password.message}</span>
 *         )}
 *       </div>
 *
 *       <button type="submit" disabled={isSubmitting || login.isPending}>
 *         {login.isPending ? 'Entrando...' : 'Entrar'}
 *       </button>
 *
 *       {login.isError && (
 *         <div className="error">
 *           Erro ao fazer login. Verifique suas credenciais.
 *         </div>
 *       )}
 *     </form>
 *   );
 * };
 * ```
 */

// ============================================
// BENEFÍCIOS DESTA ABORDAGEM
// ============================================

/**
 * ✅ VANTAGENS:
 *
 * 1. **Type Safety Completo**
 *    - TypeScript em compile-time
 *    - Zod em runtime
 *    - Impossível enviar/receber dados inválidos
 *
 * 2. **Validação em Múltiplas Camadas**
 *    - Formulário (React Hook Form + Zod)
 *    - Antes de enviar (validateRequestBody)
 *    - Após receber (validateResponse)
 *
 * 3. **Mensagens de Erro Claras**
 *    - Zod fornece mensagens customizáveis
 *    - Fácil de mostrar no UI
 *    - Erros formatados por campo
 *
 * 4. **Performance**
 *    - Validação rápida
 *    - Cache do React Query
 *    - Previne requests desnecessários
 *
 * 5. **Developer Experience**
 *    - Autocomplete completo
 *    - Erros em tempo de desenvolvimento
 *    - Menos bugs em produção
 *
 * 6. **Manutenção**
 *    - Schema único para validação e tipos
 *    - Fácil de atualizar
 *    - Auto-documentado
 */
