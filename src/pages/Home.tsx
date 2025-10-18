import { useState } from 'react';
import { Layout, Menu, Typography, theme } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  FileTextOutlined,
  SettingOutlined,
  DashboardOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Settings } from './Settings';
import { DashboardFinanceiro } from './DashboardFinanceiro';
import { TransactionForm } from './TransactionForm';
import { ProductList } from './ProductList';
import { ServiceList } from './ServiceList';
import { useThemeStore } from '../store/theme-store';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const { mode } = useThemeStore();
  const { t } = useTranslation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
      key: 'orcamentos',
      icon: <FileTextOutlined />,
      label: t('menu.quotes'),
    },
    {
      key: 'configuracoes',
      icon: <SettingOutlined />,
      label: t('menu.settings'),
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <DashboardFinanceiro />;
      case 'transacao':
        return <TransactionForm />;
      case 'clientes':
        return (
          <div>
            <Title level={2}>{t('menu.clients')}</Title>
            <p>{t('menu.clients')} - Em desenvolvimento</p>
          </div>
        );
      case 'produtos':
        return <ProductList />;
      case 'servicos':
        return <ServiceList />;
      case 'orcamentos':
        return (
          <div>
            <Title level={2}>{t('menu.quotes')}</Title>
            <p>{t('menu.quotes')} - Em desenvolvimento</p>
          </div>
        );
      case 'configuracoes':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{
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
          onClick={({ key }) => setSelectedMenu(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            CRM GetMoto
          </Title>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
