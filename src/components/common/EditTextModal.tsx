import { Modal, Form, Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const { TextArea } = Input;

interface EditTextModalProps {
  open: boolean;
  title: string;
  label: string;
  fieldName: string;
  initialValue?: string | null;
  onCancel: () => void;
  onSave: (value: string | null) => Promise<void>;
  isLoading?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

/**
 * Modal genérico para editar campos de texto (observações, descrições, etc.)
 * Suporta validação customizável e modo multiline/single line
 */
export function EditTextModal({
  open,
  title,
  label,
  fieldName,
  initialValue,
  onCancel,
  onSave,
  isLoading = false,
  required = false,
  minLength,
  maxLength,
  placeholder,
  multiline = true,
  rows = 4,
}: EditTextModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  // Atualizar form quando modal abrir
  useEffect(() => {
    if (open) {
      form.setFieldsValue({ [fieldName]: initialValue || '' });
    }
  }, [open, initialValue, fieldName, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const value = values[fieldName]?.trim() || null;
      await onSave(value);
      message.success(t('common.updateSuccess'));
      form.resetFields();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error - Ant Design já exibe
        return;
      }
      console.error('Erro ao salvar:', error);
      message.error(error.message || t('common.updateError'));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const rules = [];
  if (required) {
    rules.push({ required: true, message: t('common.fieldRequired') });
  }
  if (minLength) {
    rules.push({ min: minLength, message: t('common.minLengthError', { min: minLength }) });
  }
  if (maxLength) {
    rules.push({ max: maxLength, message: t('common.maxLengthError', { max: maxLength }) });
  }

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label={label}
          name={fieldName}
          rules={rules}
        >
          {multiline ? (
            <TextArea
              rows={rows}
              placeholder={placeholder || t('common.enterText')}
              maxLength={maxLength}
              showCount={!!maxLength}
            />
          ) : (
            <Input
              placeholder={placeholder || t('common.enterText')}
              maxLength={maxLength}
            />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}
