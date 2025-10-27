import { useState } from 'react';
import { Layout, theme } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

const { Content } = Layout;

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Mapear a rota atual para a key do menu
  const getSelectedMenuKey = () => {
    const path = location.pathname.split('/')[1];
    return path || 'dashboard';
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
        onCollapse={setCollapsed}
        selectedMenu={getSelectedMenuKey()}
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
