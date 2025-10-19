import { useState } from 'react';
import type { ReactNode } from 'react';
import { Layout, theme } from 'antd';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

const { Content } = Layout;

export interface MainLayoutProps {
  children: ReactNode;
  selectedMenu: string;
  onMenuSelect: (key: string) => void;
  onSearch: (query: string) => void;
}

export function MainLayout({
  children,
  selectedMenu,
  onMenuSelect,
  onSearch,
}: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedMenu={selectedMenu}
        onMenuSelect={onMenuSelect}
      />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: 'margin-left 0.2s',
        }}
      >
        <AppHeader onSearch={onSearch} />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
