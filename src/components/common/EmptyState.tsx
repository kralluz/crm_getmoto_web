import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  description?: string;
  image?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

/**
 * Componente de estado vazio
 * Usado quando não há dados para exibir
 */
export function EmptyState({
  description,
  image,
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '50px 20px',
      }}
    >
      <Empty
        image={image}
        description={description}
      >
        {actionText && onAction && (
          <Button
            type="primary"
            icon={icon || <PlusOutlined />}
            onClick={onAction}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}
