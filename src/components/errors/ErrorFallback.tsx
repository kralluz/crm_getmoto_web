import { Result, Button, Typography, Card } from 'antd';
import { BugOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Paragraph, Text } = Typography;

export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
}

export function ErrorFallback({ error, errorInfo, resetError }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const isDevelopment = import.meta.env.DEV;

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f5f5f5',
      }}
    >
      <Card style={{ maxWidth: 600, width: '100%' }}>
        <Result
          status="error"
          icon={<BugOutlined style={{ color: '#ff4d4f' }} />}
          title={t('errors.boundary.title')}
          subTitle={t('errors.boundary.subtitle')}
          extra={[
            <Button
              key="retry"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={resetError}
            >
              {t('errors.boundary.retry')}
            </Button>,
            <Button
              key="home"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
            >
              {t('errors.boundary.goHome')}
            </Button>,
          ]}
        >
          <div style={{ textAlign: 'left', marginTop: '24px' }}>
            <Paragraph>
              <Text strong>{t('errors.boundary.errorMessage')}:</Text>{' '}
              <Text type="danger">{error.message}</Text>
            </Paragraph>

            {isDevelopment && errorInfo && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>{t('errors.boundary.stackTrace')}:</Text>
                <pre
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px',
                  }}
                >
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </Result>
      </Card>
    </div>
  );
}
