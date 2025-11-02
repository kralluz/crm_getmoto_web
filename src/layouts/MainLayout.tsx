import { useState } from 'react';
import { Layout, theme } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

const { Content } = Layout;

export function MainLayout() {
  // Recupera estado do localStorage ou inicia como minimizado
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : true;
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Salva o estado no localStorage quando mudar
  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(value));
  };
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Mapear a rota atual para a key do menu
  const getSelectedMenuKey = () => {
    const path = location.pathname.split('/')[1];

    // Mapeia rotas específicas para suas keys de menu
    const routeMap: Record<string, string> = {
      'categorias-produtos': 'categorias-produtos',
      'categorias-servicos': 'categorias-servicos',
      'estoque': 'estoque',
      'produtos': 'produtos',
      'servicos': 'servicos',
    };

    return routeMap[path] || path || 'dashboard';
  };

  // Determinar quais submenus devem estar abertos
  const getOpenKeys = () => {
    const path = location.pathname.split('/')[1];

    if (path === 'produtos' || path === 'categorias-produtos' || path === 'estoque') {
      return ['produtos-submenu'];
    }
    if (path === 'servicos' || path === 'categorias-servicos') {
      return ['servicos-submenu'];
    }

    return [];
  };

  const handleMenuSelect = (key: string) => {
    navigate(`/${key}`);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/busca?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar
        collapsed={collapsed}
        onCollapse={handleCollapse}
        selectedMenu={getSelectedMenuKey()}
        openKeys={getOpenKeys()}
        onMenuSelect={handleMenuSelect}
      />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: 'margin-left 0.2s',
        }}
      >
        <AppHeader onSearch={handleSearch} />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
