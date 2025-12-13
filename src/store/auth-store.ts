import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  user_id?: string | number; // ID do backend
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  login: (user: User, token: string, refreshToken: string) => void;
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
      // Estado inicial - usuário não autenticado
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        // Normalizar user_id para id
        const normalizedUser = {
          ...user,
          id: user.id || String(user.user_id || ''),
        };
        set({
          user: normalizedUser,
          isAuthenticated: true,
        });
      },

      setToken: (token) => {
        localStorage.setItem('auth_token', token);
        set({ token });
      },

      setRefreshToken: (refreshToken) => {
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        } else {
          localStorage.removeItem('refresh_token');
        }
        set({ refreshToken });
      },

      login: (user, token, refreshToken) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        // Normalizar user_id para id
        const normalizedUser = {
          ...user,
          id: user.id || String(user.user_id || ''),
        };
        set({
          user: normalizedUser,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          token: null,
          refreshToken: null,
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
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        // Não persiste isLoading
      }),
    }
  )
);
