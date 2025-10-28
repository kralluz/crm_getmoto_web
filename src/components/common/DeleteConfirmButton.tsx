import { useState } from 'react';
import { Button, Modal } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmButtonProps {
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  loading?: boolean;
  buttonType?: 'text' | 'link' | 'default' | 'primary' | 'dashed';
  buttonSize?: 'small' | 'middle' | 'large';
  danger?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

export function DeleteConfirmButton({
  onConfirm,
  title,
  description,
  loading = false,
  buttonType = 'text',
  buttonSize = 'small',
  danger = true,
  icon = <DeleteOutlined />,
  iconOnly = false,
}: DeleteConfirmButtonProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        type={buttonType}
        size={buttonSize}
        danger={danger}
        icon={icon}
        onClick={handleOpenModal}
        loading={loading}
      >
        {!iconOnly && t('common.delete')}
      </Button>

      <Modal
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            {title || t('confirm.delete')}
          </span>
        }
        open={isModalOpen}
        onOk={handleConfirm}
        onCancel={handleCancel}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        okButtonProps={{
          danger: true,
          loading: isDeleting,
        }}
        cancelButtonProps={{
          disabled: isDeleting,
        }}
      >
        <p>{description || t('confirm.deleteDescription')}</p>
      </Modal>
    </>
  );
}
