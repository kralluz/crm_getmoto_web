import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { CurrencyInput } from '../common/CurrencyInput';
import {
  useServiceCategory,
  useCreateServiceCategory,
  useUpdateServiceCategory,
} from '../../hooks/useServiceCategories';
import type {
  CreateServiceCategoryData,
  UpdateServiceCategoryData,
} from '../../types/service-category';
import { parseDecimal } from '../../utils';

interface ServiceCategoryModalProps {
  open: boolean;
  categoryId?: number;
  onClose: () => void;
}

export function ServiceCategoryModal({ open, categoryId, onClose }: ServiceCategoryModalProps) {
  const { t } = useTranslation();
  const isEditing = !!categoryId;

  const [form] = Form.useForm();

  const { data: category } = useServiceCategory(categoryId);
  const { mutate: createCategory, isPending: isCreating } = useCreateServiceCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateServiceCategory();

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (category && isEditing) {
      form.setFieldsValue({
        service_name: category.service_name,
        service_cost: parseDecimal(category.service_cost),
        is_active: category.is_active,
      });
    }
  }, [category, isEditing, form]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEditing && categoryId) {
        updateCategory(
          { id: categoryId, data: values as UpdateServiceCategoryData },
          {
            onSuccess: () => {
              onClose();
            },
            onError: (error: any) => {
              if (error?.response?.status === 409) {
                form.setFields([
                  {
                    name: 'service_name',
                    errors: [t('services.errors.nameExists')],
                  },
                ]);
              }
            },
          }
        );
      } else {
        createCategory(values as CreateServiceCategoryData, {
          onSuccess: () => {
            onClose();
          },
          onError: (error: any) => {
            if (error?.response?.status === 409) {
              form.setFields([
                {
                  name: 'service_name',
                  errors: [t('services.errors.nameExists')],
                },
              ]);
            }
          },
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={isEditing ? t('products.editServiceCategory') : t('products.newServiceCategory')}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditing ? t('products.updateServiceCategory') : t('products.createServiceCategory')}
      cancelText={t('common.cancel')}
      confirmLoading={isSaving}
      width={600}
      maskClosable={false}
    >
      {open && (
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{
            is_active: true,
            service_cost: 0,
          }}
        >
        <Form.Item
          label={t('products.serviceCategoryName')}
          name="service_name"
          rules={[
            { required: true, message: t('products.serviceCategoryNameRequired') },
            { min: 3, message: t('products.serviceCategoryNameMinLength') },
            { max: 255, message: t('products.serviceCategoryNameMaxLength') },
          ]}
        >
          <Input
            placeholder={t('products.serviceCategoryPlaceholder')}
          />
        </Form.Item>

        <Form.Item
          label={t('products.serviceCost')}
          name="service_cost"
          rules={[
            { required: true, message: t('products.serviceCostRequired') },
            {
              type: 'number',
              min: 0,
              message: t('products.serviceCostPositive'),
            },
          ]}
        >
          <CurrencyInput
            placeholder="R$ 0,00"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label={t('common.status')}
          name="is_active"
          valuePropName="checked"
        >
          <Switch
            checkedChildren={t('common.active')}
            unCheckedChildren={t('common.inactive')}
          />
        </Form.Item>
      </Form>
      )}
    </Modal>
  );
}
