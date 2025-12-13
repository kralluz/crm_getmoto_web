import { Dropdown, Avatar, Typography, Space } from 'antd';
import { LogoutOutlined, SettingOutlined, BulbOutlined, GlobalOutlined, CheckOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';
import { useLanguageStore, type Language } from '../store/language-store';
import { authApi } from '../api/auth-api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NotificationService } from '../services/notification.service';
import i18n from '../i18n/config';

const { Text } = Typography;

export function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const navigate = useNavigate();

  // Função para obter o primeiro nome
  const getFirstName = (name?: string): string => {
    if (!name) return t('common.user') || 'Usuário';
    const firstName = name.trim().split(' ')[0];
    return firstName || name;
  };

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

  const handleThemeToggle = (e: any) => {
    e.domEvent.stopPropagation();
    toggleTheme();
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    NotificationService.success(t('common.languageChanged'));
  };

  const getLanguageLabel = (lang: Language): string => {
    const labels: Record<Language, string> = {
      'pt-BR': 'Português (BR)',
      'en': 'English (UK)',
      'es': 'Español',
    };
    return labels[lang];
  };

  const languageItems: MenuProps['items'] = [
    {
      key: 'pt-BR',
      label: getLanguageLabel('pt-BR'),
      icon: language === 'pt-BR' ? <CheckOutlined /> : null,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        handleLanguageChange('pt-BR');
      },
    },
    {
      key: 'en',
      label: getLanguageLabel('en'),
      icon: language === 'en' ? <CheckOutlined /> : null,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        handleLanguageChange('en');
      },
    },
    {
      key: 'es',
      label: getLanguageLabel('es'),
      icon: language === 'es' ? <CheckOutlined /> : null,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        handleLanguageChange('es');
      },
    },
  ];

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
      key: 'language',
      icon: <GlobalOutlined />,
      label: t('common.language') || 'Idioma',
      children: languageItems,
    },
    {
      key: 'theme',
      icon: <BulbOutlined />,
      label: t('common.changeTheme') || 'Alterar Tema',
      onClick: handleThemeToggle,
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
          gap: '12px',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <Space size={8} align="center">
          <Text style={{ fontSize: '14px', fontWeight: 500 }}>
            {t('common.welcome')}, {getFirstName(user?.name)}!
          </Text>
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
        </Space>
      </div>
    </Dropdown>
  );
}
