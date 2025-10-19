import { Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
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
            <Title level={2} style={{ margin: 0 }}>
              {title}
            </Title>
            {subtitle && (
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {subtitle}
              </Text>
            )}
          </div>
        </Space>
        {extra && <Space>{extra}</Space>}
      </div>
      {children}
    </div>
  );
}
