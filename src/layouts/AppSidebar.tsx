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
  DollarOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Sider } = Layout;

export interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  selectedMenu: string;
  openKeys?: string[];
  onMenuSelect: (key: string) => void;
  isMobile?: boolean;
}

export function AppSidebar({
  collapsed,
  onCollapse,
  selectedMenu,
  openKeys: initialOpenKeys = [],
  onMenuSelect,
  isMobile = false,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const [openKeys, setOpenKeys] = useState<string[]>(['dashboard-submenu', 'cadastros-submenu', 'servicos-submenu', 'despesas-submenu', 'produtos-submenu']);

  // Atualizar openKeys quando initialOpenKeys mudar, mas mantém dashboard, serviços, despesas e produtos sempre abertos
  useEffect(() => {
    // Mescla os openKeys iniciais com os padrões
    const defaultKeys = ['dashboard-submenu', 'cadastros-submenu', 'servicos-submenu', 'despesas-submenu', 'produtos-submenu'];
    const mergedKeys = Array.from(new Set([...defaultKeys, ...initialOpenKeys]));
    setOpenKeys(mergedKeys);
  }, [initialOpenKeys]);

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const handleCollapseClick = (newCollapsed: boolean) => {
    // Permite colapsar apenas em mobile
    if (isMobile) {
      onCollapse(newCollapsed);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard-submenu',
      icon: <DashboardOutlined />,
      label: t('menu.overview'),
      children: [
        {
          key: 'dashboard',
          icon: <BarChartOutlined />,
          label: t('menu.dashboard'),
        },
      ],
    },
    {
      key: 'servicos-submenu',
      icon: <ToolOutlined />,
      label: t('menu.serviceOrders'),
      children: [
        {
          key: 'servicos',
          icon: <ToolOutlined />,
          label: t('menu.manageOrders'),
        },
        {
          key: 'categorias-servicos',
          icon: <TagsOutlined />,
          label: t('menu.serviceCategories'),
        },
      ],
    },
    {
      key: 'despesas-submenu',
      icon: <DollarOutlined />,
      label: t('menu.expenses'),
      children: [
        {
          key: 'despesas',
          icon: <DollarOutlined />,
          label: t('menu.manageExpenses'),
        },
      ],
    },
    {
      key: 'veiculos',
      icon: <CarOutlined />,
      label: t('menu.vehicles'),
    },
    {
      key: 'produtos-submenu',
      icon: <ShoppingCartOutlined />,
      label: t('menu.productsStock'),
      children: [
        {
          key: 'estoque',
          icon: <ShoppingCartOutlined />,
          label: t('menu.stockControl'),
        },
        {
          key: 'produtos',
          icon: <AppstoreOutlined />,
          label: t('menu.productRegistration'),
        },
        {
          key: 'categorias-produtos',
          icon: <TagsOutlined />,
          label: t('menu.productCategories'),
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
      collapsible={isMobile}
      collapsed={collapsed}
      width={260}
      collapsedWidth={isMobile ? 0 : 260}
      onCollapse={handleCollapseClick}
      theme="light"
      trigger={isMobile ? undefined : null}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        zIndex: isMobile ? 1000 : 1,
      }}
    >
      <div
        style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {collapsed ? (
          <HomeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        ) : (
          <img
            src="/logo-getmoto-transparent.png"
            alt="GetMoto LTD."
            style={{
              width: '100%',
              maxWidth: '180px',
              height: 'auto',
            }}
          />
        )}
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedMenu]}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        items={menuItems}
        onClick={({ key }) => {
          onMenuSelect(key);
          // Fecha o menu em mobile após seleção
          if (isMobile) {
            onCollapse(true);
          }
        }}
        triggerSubMenuAction={isMobile ? 'click' : 'hover'}
      />
    </Sider>
  );
}
