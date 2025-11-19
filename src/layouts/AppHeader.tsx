import { Layout, Typography, theme, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { GlobalSearch } from '../components/GlobalSearch';
import { UserMenu } from '../components/UserMenu';

const { Header } = Layout;
const { Title } = Typography;

export interface AppHeaderProps {
  onSearch: (query: string) => void;
  isMobile?: boolean;
  onMenuToggle?: () => void;
}

export function AppHeader({ onSearch, isMobile = false, onMenuToggle }: AppHeaderProps) {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Header
      style={{
        padding: isMobile ? '0 12px' : '0 24px',
        background: colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '8px' : '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      {isMobile && onMenuToggle && (
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: 20 }} />}
          onClick={onMenuToggle}
          style={{ padding: '4px 8px' }}
        />
      )}
      {!isMobile && (
        <Title level={3} style={{ margin: 0, whiteSpace: 'nowrap' }}>
          GetMoto LTD.
        </Title>
      )}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: isMobile ? 'flex-start' : 'center',
          maxWidth: isMobile ? 'none' : '600px',
        }}
      >
        <GlobalSearch onSearch={onSearch} />
      </div>
      <UserMenu />
    </Header>
  );
}
