import { Tabs } from 'antd';
import { SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { UsersSettings } from '../components/settings/UsersSettings';

export function Settings() {
  const { t } = useTranslation();

  const items = [
    {
      key: 'general',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined />
          {t('settings.general')}
        </span>
      ),
      children: <GeneralSettings />,
    },
    {
      key: 'users',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined />
          {t('settings.usersTab')}
        </span>
      ),
      children: <UsersSettings />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        helpText={t('settings.pageHelp')}
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
