import { Tag } from 'antd';
import type { TagProps } from 'antd';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'processing' | 'default';

export interface StatusBadgeProps {
  status: StatusType;
  text: string;
  icon?: React.ReactNode;
}

/**
 * Componente de badge de status
 * Cores consistentes para diferentes estados
 */
export function StatusBadge({ status, text, icon }: StatusBadgeProps) {
  const colorMap: Record<StatusType, TagProps['color']> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'blue',
    processing: 'processing',
    default: 'default',
  };

  return (
    <Tag color={colorMap[status]} icon={icon}>
      {text}
    </Tag>
  );
}
