import { useEffect } from 'react';
import { Form, Input, Switch, Button, Card, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader';
import { CurrencyInput } from '../components/common/CurrencyInput';
import {
  useServiceCategory,
  useCreateServiceCategory,
  useUpdateServiceCategory,
} from '../hooks/useServiceCategories';
import type {
  CreateServiceCategoryData,
  UpdateServiceCategoryData,
} from '../types/service-category';
import { parseDecimal } from '../utils';

export function ServiceCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditing = !!id;

  const [form] = Form.useForm();

  const { data: category, isLoading } = useServiceCategory(
    isEditing ? parseInt(id!) : undefined
  );
  const { mutate: createCategory, isPending: isCreating } = useCreateServiceCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateServiceCategory();

  useEffect(() => {
    if (category && isEditing) {
      form.setFieldsValue({
        service_name: category.service_name,
        service_cost: parseDecimal(category.service_cost),
        is_active: category.is_active,
      });
    }
  }, [category, isEditing, form]);

  const handleSubmit = (values: CreateServiceCategoryData | UpdateServiceCategoryData) => {
    if (isEditing) {
      updateCategory(
        { id: parseInt(id!), data: values },
        {
          onSuccess: () => {
            navigate('/categorias-servicos');
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
          navigate('/categorias-servicos');
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
  };

  const handleCancel = () => {
    navigate('/categorias-servicos');
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? t('products.editServiceCategory') : t('products.newServiceCategory')}
        subtitle={isEditing ? t('products.editServiceCategorySubtitle') : t('products.newServiceCategorySubtitle')}
      />

      <Card loading={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
              size="large"
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
              placeholder="£0.00"
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

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isCreating || isUpdating}
                size="large"
              >
                {isEditing ? t('products.updateServiceCategory') : t('products.createServiceCategory')}
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
