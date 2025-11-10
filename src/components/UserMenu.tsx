import { Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
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
      <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}>
        <Avatar 
          icon={<UserOutlined />} 
          style={{ backgroundColor: '#1677ff' }}
        />
        <Text strong style={{ color: '#262626' }}>
          {user?.name || 'Usuário'}
        </Text>
      </Space>
    </Dropdown>
  );
}
