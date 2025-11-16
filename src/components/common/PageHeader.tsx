import { Typography, Button, Space, Tooltip } from 'antd';
import { ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  helpText?: string;
  onBack?: () => void;
  extra?: ReactNode;
  children?: ReactNode;
}

/**
 * Componente de cabeçalho de página
 * Padrão consistente para todas as páginas
 */
export function PageHeader({
  title,
  subtitle,
  helpText,
  onBack,
  extra,
  children,
}: PageHeaderProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: subtitle ? '8px' : '0',
        }}
      >
        <Space align="start">
          {onBack && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ marginTop: '4px' }}
            />
          )}
          <div>
            <Space align="center" size="small" style={{ marginBottom: subtitle ? '4px' : '0' }}>
              <Title level={2} style={{ margin: 0 }}>
                {title}
              </Title>
              {helpText && (
                <Tooltip title={helpText} placement="right" overlayStyle={{ maxWidth: '400px' }}>
                  <QuestionCircleOutlined
                    style={{
                      fontSize: '18px',
                      color: '#1890ff',
                      cursor: 'help',
                      marginTop: '4px',
                    }}
                  />
                </Tooltip>
              )}
            </Space>
            {subtitle && (
              <div>
                <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
                  {subtitle}
                </Text>
              </div>
            )}
          </div>
        </Space>
        {extra && <Space>{extra}</Space>}
      </div>
      {children}
    </div>
  );
}
