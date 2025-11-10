import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useProductCategory,
  useCreateProductCategory,
  useUpdateProductCategory,
} from '../../hooks/useProductCategories';
import type {
  CreateProductCategoryData,
  UpdateProductCategoryData,
} from '../../types/product-category';

interface ProductCategoryModalProps {
  open: boolean;
  categoryId?: number;
  onClose: () => void;
}

export function ProductCategoryModal({ open, categoryId, onClose }: ProductCategoryModalProps) {
  const { t } = useTranslation();
  const isEditing = !!categoryId;

  const [form] = Form.useForm();

  const { data: category } = useProductCategory(categoryId);
  const { mutate: createCategory, isPending: isCreating } = useCreateProductCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateProductCategory();

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (category && isEditing) {
      form.setFieldsValue({
        product_category_name: category.product_category_name,
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
          { id: categoryId, data: values as UpdateProductCategoryData },
          {
            onSuccess: () => {
              onClose();
            },
            onError: (error: any) => {
              if (error?.response?.status === 409) {
                form.setFields([
                  {
                    name: 'product_category_name',
                    errors: [t('products.categoryExistsError')],
                  },
                ]);
              }
            },
          }
        );
      } else {
        createCategory(values as CreateProductCategoryData, {
          onSuccess: () => {
            onClose();
          },
          onError: (error: any) => {
            if (error?.response?.status === 409) {
              form.setFields([
                {
                  name: 'product_category_name',
                  errors: [t('products.categoryExistsError')],
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
      title={isEditing ? t('products.editCategoryTitle') : t('products.newCategoryTitle')}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditing ? t('products.updateCategory') : t('products.createCategory')}
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
          }}
        >
        <Form.Item
          label={t('products.categoryName')}
          name="product_category_name"
          rules={[
            { required: true, message: t('products.categoryNameRequired') },
            { min: 3, message: t('products.categoryNameMinLength') },
            { max: 255, message: t('products.categoryNameMaxLength') },
          ]}
        >
          <Input
            placeholder={t('products.categoryPlaceholder')}
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
