import { useState, useEffect } from 'react';
import { Layout, theme } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

const { Content } = Layout;

export function MainLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Recupera estado do localStorage ou inicia como minimizado
  // Em mobile, sempre inicia colapsado
  const [collapsed, setCollapsed] = useState(() => {
    if (window.innerWidth < 768) return true;
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : true;
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Detecta mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Sempre fecha o menu quando redimensiona para mobile
      if (mobile) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Salva o estado no localStorage quando mudar (apenas em desktop)
  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(value));
    }
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

    if (path === 'dashboard') {
      return ['dashboard-submenu'];
    }
    if (path === 'servicos' || path === 'categorias-servicos') {
      return ['servicos-submenu'];
    }
    if (path === 'despesas') {
      return ['despesas-submenu'];
    }
    if (path === 'produtos' || path === 'categorias-produtos' || path === 'estoque') {
      return ['produtos-submenu'];
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
      {/* Overlay para mobile quando menu está aberto */}
      {isMobile && !collapsed && (
        <div
          onClick={() => handleCollapse(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999,
          }}
        />
      )}

      <AppSidebar
        collapsed={collapsed}
        onCollapse={handleCollapse}
        selectedMenu={getSelectedMenuKey()}
        openKeys={getOpenKeys()}
        onMenuSelect={handleMenuSelect}
        isMobile={isMobile}
      />
      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
          transition: 'margin-left 0.2s',
        }}
      >
        <AppHeader
          onSearch={handleSearch}
          isMobile={isMobile}
          onMenuToggle={() => handleCollapse(!collapsed)}
        />
        <Content
          style={{
            margin: isMobile ? '12px 8px' : '24px 16px',
            padding: isMobile ? 16 : 24,
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
