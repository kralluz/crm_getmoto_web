import { Tabs } from 'antd';
import { SettingOutlined, UserOutlined } from '@ant-design/icons';
import { PageHeader } from '../components/common/PageHeader';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { UsersSettings } from '../components/settings/UsersSettings';

export function Settings() {
  const items = [
    {
      key: 'general',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined />
          Geral
        </span>
      ),
      children: <GeneralSettings />,
    },
    {
      key: 'users',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined />
          Usuários
        </span>
      ),
      children: <UsersSettings />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Gerencie as configurações do sistema"
      />

      <Tabs
        defaultActiveKey="general"
        items={items}
        size="large"
        style={{ marginTop: 24 }}
      />
    </div>
  );
}
