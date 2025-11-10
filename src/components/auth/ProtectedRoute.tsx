import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../store/auth-store';
import { useMe } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rotas privadas
 * Redireciona para login se usuário não estiver autenticado
 * Valida token com o backend via hook useMe
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, token } = useAuthStore();
  const { isLoading, isError } = useMe();

  // Se não há token, redireciona imediatamente para login
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enquanto valida o token com backend, mostra loading
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Se houver erro ao validar token (401, etc), redireciona para login
  if (isError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token válido, renderiza conteúdo protegido
  return <>{children}</>;
}
