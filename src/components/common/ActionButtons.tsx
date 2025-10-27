import { Space, Button, Tooltip } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DeleteConfirmButton } from './DeleteConfirmButton';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  onView?: () => void;
  loading?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  deleteTitle?: string;
  deleteDescription?: string;
  size?: 'small' | 'middle' | 'large';
}

export function ActionButtons({
  onEdit,
  onDelete,
  onView,
  loading = false,
  showEdit = true,
  showDelete = true,
  showView = false,
  deleteTitle,
  deleteDescription,
  size = 'small',
}: ActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <Space size="small">
      {showView && onView && (
        <Tooltip title={t('common.view')}>
          <Button
            type="text"
            size={size}
            icon={<EyeOutlined />}
            onClick={onView}
            loading={loading}
          >
            {t('common.view')}
          </Button>
        </Tooltip>
      )}

      {showEdit && onEdit && (
        <Tooltip title={t('common.edit')}>
          <Button
            type="text"
            size={size}
            icon={<EditOutlined />}
            onClick={onEdit}
            loading={loading}
          >
            {t('common.edit')}
          </Button>
        </Tooltip>
      )}

      {showDelete && onDelete && (
        <DeleteConfirmButton
          onConfirm={onDelete}
          loading={loading}
          title={deleteTitle}
          description={deleteDescription}
          buttonSize={size}
        />
      )}
    </Space>
  );
}
