import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export interface ConfirmDialogOptions {
  title: string;
  content: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'danger' | 'default';
  icon?: React.ReactNode;
}

/**
 * Função helper para mostrar diálogo de confirmação
 * Wrapper tipado do Modal.confirm do Ant Design
 */
export function showConfirmDialog({
  title,
  content,
  onConfirm,
  onCancel,
  okText,
  cancelText,
  okType = 'primary',
  icon,
}: ConfirmDialogOptions): void {
  Modal.confirm({
    title,
    content,
    icon: icon || <ExclamationCircleOutlined />,
    okText: okText,
    cancelText: cancelText,
    okType,
    onOk: async () => {
      await onConfirm();
    },
    onCancel: () => {
      onCancel?.();
    },
  });
}

/**
 * Hook para usar diálogo de confirmação com i18n
 */
export function useConfirmDialog() {
  const { t } = useTranslation();

  return {
    confirm: (options: Omit<ConfirmDialogOptions, 'okText' | 'cancelText'> & { okText?: string; cancelText?: string }) => {
      showConfirmDialog({
        ...options,
        okText: options.okText || t('common.confirm'),
        cancelText: options.cancelText || t('common.cancel'),
      });
    },
    confirmDelete: (options: Omit<ConfirmDialogOptions, 'okText' | 'cancelText' | 'okType'>) => {
      showConfirmDialog({
        ...options,
        okText: t('common.delete'),
        cancelText: t('common.cancel'),
        okType: 'danger',
      });
    },
  };
}
