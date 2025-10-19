import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  SettingOutlined,
  DashboardOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Sider } = Layout;

export interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  selectedMenu: string;
  onMenuSelect: (key: string) => void;
}

export function AppSidebar({
  collapsed,
  onCollapse,
  selectedMenu,
  onMenuSelect,
}: AppSidebarProps) {
  const { t } = useTranslation();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('menu.dashboard'),
    },
    {
      key: 'transacao',
      icon: <PlusCircleOutlined />,
      label: t('menu.newTransaction'),
    },
    {
      key: 'clientes',
      icon: <UserOutlined />,
      label: t('menu.clients'),
    },
    {
      key: 'produtos',
      icon: <ShoppingCartOutlined />,
      label: t('menu.products'),
    },
    {
      key: 'servicos',
      icon: <ToolOutlined />,
      label: t('menu.services'),
    },
    {
      key: 'configuracoes',
      icon: <SettingOutlined />,
      label: t('menu.settings'),
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      theme="light"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          color: '#1890ff',
        }}
      >
        {collapsed ? <HomeOutlined /> : 'GetMoto'}
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedMenu]}
        items={menuItems}
        onClick={({ key }) => onMenuSelect(key)}
      />
    </Sider>
  );
}
