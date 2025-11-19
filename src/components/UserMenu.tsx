import { Dropdown, Avatar, Typography } from 'antd';
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '../store/auth-store';
import { authApi } from '../api/auth-api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NotificationService } from '../services/notification.service';

const { Text } = Typography;

export function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Função para obter as iniciais do nome
  const getInitials = (name?: string): string => {
    if (!name) return 'U';

    const nameParts = name.trim().split(' ').filter(part => part.length > 0);

    if (nameParts.length === 0) return 'U';
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();

    // Primeira letra do primeiro nome + primeira letra do último nome
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Função para gerar uma cor baseada no nome
  const getAvatarColor = (name?: string): string => {
    if (!name) return '#1677ff';

    const colors = [
      '#1677ff', // Azul
      '#52c41a', // Verde
      '#faad14', // Laranja
      '#f5222d', // Vermelho
      '#722ed1', // Roxo
      '#13c2c2', // Ciano
      '#eb2f96', // Pink
    ];

    // Usa o código do primeiro caractere para escolher uma cor consistente
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const handleLogout = async () => {
    try {
      // Chama API de logout
      await authApi.logout();
      
      // Limpa o estado local
      logout();
      
      // Redireciona para login
      navigate('/login');
      
      NotificationService.success(t('auth.logoutSuccess'));
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      NotificationService.error(t('auth.logoutError'));
      
      // Mesmo com erro, limpa dados locais e redireciona
      logout();
      navigate('/login');
    }
  };

  const handleSettings = () => {
    navigate('/configuracoes');
  };

  const items: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong>{user?.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {user?.email}
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('common.settings') || 'Configurações',
      onClick: handleSettings,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout') || 'Sair',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
      <div
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <Avatar
          style={{
            backgroundColor: getAvatarColor(user?.name),
            fontWeight: 500,
            fontSize: 16,
          }}
          size="large"
        >
          {getInitials(user?.name)}
        </Avatar>
      </div>
    </Dropdown>
  );
}
