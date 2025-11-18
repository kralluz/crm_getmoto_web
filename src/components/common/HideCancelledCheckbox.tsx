import { Checkbox } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface HideCancelledCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Componente de checkbox para controlar a visibilidade de itens cancelados
 * Exibe ícone de olho e texto traduzido
 */
export function HideCancelledCheckbox({ checked, onChange }: HideCancelledCheckboxProps) {
  const { t } = useTranslation();

  return (
    <Checkbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    >
      {checked ? <EyeInvisibleOutlined /> : <EyeOutlined />}
      {' '}{t('common.hideCancelled')}
    </Checkbox>
  );
}
