import { Card, Switch, Typography, Space, Select } from 'antd';
import { BulbOutlined, MoonOutlined, GlobalOutlined } from '@ant-design/icons';
import { useThemeStore } from '../store/theme-store';
import { useLanguageStore, type Language } from '../store/language-store';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export function Settings() {
  const { mode, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div>
      <Title level={2}>{t('settings.title')}</Title>

      <Card title={t('settings.theme')} style={{ marginTop: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              {mode === 'light' ? (
                <BulbOutlined style={{ fontSize: 20 }} />
              ) : (
                <MoonOutlined style={{ fontSize: 20 }} />
              )}
              <div>
                <Text strong>{t('settings.theme')}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('settings.themeDescription')}
                </Text>
              </div>
            </Space>
            <Switch
              checked={mode === 'dark'}
              onChange={toggleTheme}
              checkedChildren={t('settings.dark')}
              unCheckedChildren={t('settings.light')}
            />
          </div>
        </Space>
      </Card>

      <Card title={t('settings.language')} style={{ marginTop: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <GlobalOutlined style={{ fontSize: 20 }} />
              <div>
                <Text strong>{t('settings.language')}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('settings.languageDescription')}
                </Text>
              </div>
            </Space>
            <Select
              value={language}
              onChange={handleLanguageChange}
              style={{ width: 200 }}
              options={[
                { value: 'pt-BR', label: t('settings.portuguese') },
                { value: 'en', label: t('settings.english') },
              ]}
            />
          </div>
        </Space>
      </Card>
    </div>
  );
}
