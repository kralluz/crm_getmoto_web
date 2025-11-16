import { Layout, Typography, theme } from 'antd';
import { GlobalSearch } from '../components/GlobalSearch';
import { UserMenu } from '../components/UserMenu';

const { Header } = Layout;
const { Title } = Typography;

export interface AppHeaderProps {
  onSearch: (query: string) => void;
}

export function AppHeader({ onSearch }: AppHeaderProps) {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Header
      style={{
        padding: '0 24px',
        background: colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <Title level={3} style={{ margin: 0 }}>
        GetMoto LTD.
      </Title>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '600px' }}>
        <GlobalSearch onSearch={onSearch} />
      </div>
      <UserMenu />
    </Header>
  );
}
