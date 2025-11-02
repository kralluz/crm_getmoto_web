import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store';
import type { UserRole } from '../../types/user';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

/**
 * Componente que verifica se o usuário tem permissão baseada em role
 * Se não tiver permissão, mostra página de acesso negado
 */
export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica se o role do usuário está na lista de roles permitidos
  const hasPermission = user.role && allowedRoles.includes(user.role as UserRole);

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="Acesso Negado"
        subTitle="Você não tem permissão para acessar esta página."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        }
      />
    );
  }

  // Usuário tem permissão, renderiza conteúdo
  return <>{children}</>;
}
