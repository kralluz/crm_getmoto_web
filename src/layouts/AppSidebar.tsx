import { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  SettingOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  TagsOutlined,
  BarChartOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Sider } = Layout;

export interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  selectedMenu: string;
  openKeys?: string[];
  onMenuSelect: (key: string) => void;
}

export function AppSidebar({
  collapsed,
  onCollapse,
  selectedMenu,
  openKeys: initialOpenKeys = [],
  onMenuSelect,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const [openKeys, setOpenKeys] = useState<string[]>(['dashboard-submenu', 'produtos-submenu', 'servicos-submenu']);

  // Atualizar openKeys quando initialOpenKeys mudar, mas mantém dashboard, produtos e serviços sempre abertos
  useEffect(() => {
    // Mescla os openKeys iniciais com os padrões
    const defaultKeys = ['dashboard-submenu', 'produtos-submenu', 'servicos-submenu'];
    const mergedKeys = Array.from(new Set([...defaultKeys, ...initialOpenKeys]));
    setOpenKeys(mergedKeys);
  }, [initialOpenKeys]);

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard-submenu',
      icon: <DashboardOutlined />,
      label: t('menu.dashboard'),
      children: [
        {
          key: 'dashboard',
          icon: <BarChartOutlined />,
          label: 'Relatório',
        },
        {
          key: 'movimentacoes',
          icon: <TransactionOutlined />,
          label: 'Movimentações',
        },
      ],
    },
    {
      key: 'produtos-submenu',
      icon: <ShoppingCartOutlined />,
      label: t('menu.products'),
      children: [
        {
          key: 'estoque',
          icon: <ShoppingCartOutlined />,
          label: 'Estoque',
        },
        {
          key: 'produtos',
          icon: <AppstoreOutlined />,
          label: 'Produtos',
        },
        {
          key: 'categorias-produtos',
          icon: <TagsOutlined />,
          label: 'Categorias',
        },
      ],
    },
    {
      key: 'servicos-submenu',
      icon: <ToolOutlined />,
      label: t('menu.services'),
      children: [
        {
          key: 'servicos',
          icon: <ToolOutlined />,
          label: 'Ordens de Serviço',
        },
        {
          key: 'categorias-servicos',
          icon: <TagsOutlined />,
          label: 'Categorias',
        },
      ],
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
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        items={menuItems}
        onClick={({ key }) => onMenuSelect(key)}
      />
    </Sider>
  );
}
