import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Store Zustand para gerenciamento de autenticação
 * Utiliza middleware de persistência para manter o estado no localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Mock user for testing - remove in production
      user: {
        id: 'mock-user-id',
        name: 'Usuário Teste',
        email: 'teste@getmoto.com',
        role: 'ADMIN',
      },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setToken: (token) => {
        localStorage.setItem('auth_token', token);
        set({ token });
      },

      login: (user, token) => {
        localStorage.setItem('auth_token', token);
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),
    }),
    {
      name: 'auth-storage', // nome do item no localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // Não persiste isLoading
      }),
    }
  )
);
