import { Tabs } from 'antd';
import { SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { UsersSettings } from '../components/settings/UsersSettings';

export function Settings() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const items = [
    {
      key: 'general',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined />
          {!isMobile && t('settings.general')}
        </span>
      ),
      children: <GeneralSettings />,
    },
    {
      key: 'users',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined />
          {!isMobile && t('settings.usersTab')}
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
        size={isMobile ? "small" : "large"}
        style={{ marginTop: 24 }}
      />
    </div>
  );
}
