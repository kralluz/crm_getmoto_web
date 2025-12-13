import { Alert, Button, Space } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface CustomerSuggestionProps {
  customerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export function CustomerSuggestion({
  customerName,
  onAccept,
  onReject,
}: CustomerSuggestionProps) {
  const { t } = useTranslation();

  return (
    <Alert
      message={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>
              <strong>{t('services.lastCustomerSuggestion')}:</strong> {customerName}
            </span>
          </div>
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={onAccept}
            >
              {t('common.yes')}
            </Button>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={onReject}
            >
              {t('common.no')}
            </Button>
          </Space>
        </Space>
      }
      type="info"
      showIcon={false}
      style={{ marginBottom: 16 }}
    />
  );
}
