import { useEffect } from 'react';
import { Form, Input, Switch, Button, Card, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader';
import {
  useProductCategory,
  useCreateProductCategory,
  useUpdateProductCategory,
} from '../hooks/useProductCategories';
import type {
  CreateProductCategoryData,
  UpdateProductCategoryData,
} from '../types/product-category';

export function ProductCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditing = !!id;

  const [form] = Form.useForm();

  const { data: category, isLoading } = useProductCategory(
    isEditing ? parseInt(id!) : undefined
  );
  const { mutate: createCategory, isPending: isCreating } = useCreateProductCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateProductCategory();

  useEffect(() => {
    if (category && isEditing) {
      form.setFieldsValue({
        product_category_name: category.product_category_name,
        is_active: category.is_active,
      });
    }
  }, [category, isEditing, form]);

  const handleSubmit = (values: CreateProductCategoryData | UpdateProductCategoryData) => {
    if (isEditing) {
      updateCategory(
        { id: parseInt(id!), data: values },
        {
          onSuccess: () => {
            navigate('/categorias-produtos');
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
          navigate('/categorias-produtos');
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
  };

  const handleCancel = () => {
    navigate('/categorias-produtos');
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? t('products.editCategoryTitle') : t('products.newCategoryTitle')}
        subtitle={isEditing ? t('products.updateCategorySubtitle') : t('products.newCategorySubtitle')}
      />

      <Card loading={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
              size="large"
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

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isCreating || isUpdating}
                size="large"
              >
                {isEditing ? t('products.updateCategory') : t('products.createCategory')}
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleCancel}
                size="large"
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
