import { useEffect } from 'react';
import { Form, Input, Switch, Button, Card, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import {
  useProductCategory,
  useCreateProductCategory,
  useUpdateProductCategory,
} from '../hooks/useProductCategories';
import type { CreateProductCategoryData, UpdateProductCategoryData } from '../types/product-category';

export function ProductCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
                  errors: ['Já existe uma categoria com este nome'],
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
                errors: ['Já existe uma categoria com este nome'],
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
        title={isEditing ? 'Editar Categoria de Produto' : 'Nova Categoria de Produto'}
        subtitle={isEditing ? 'Atualize os dados da categoria' : 'Preencha os dados da nova categoria'}
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
            label="Nome da Categoria"
            name="product_category_name"
            rules={[
              { required: true, message: 'Por favor, informe o nome da categoria' },
              { min: 3, message: 'O nome deve ter no mínimo 3 caracteres' },
              { max: 255, message: 'O nome deve ter no máximo 255 caracteres' },
            ]}
          >
            <Input
              placeholder="Ex: Pneus, Óleo Lubrificante, Peças de Motor"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="is_active"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Ativo"
              unCheckedChildren="Inativo"
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
                {isEditing ? 'Atualizar' : 'Criar'} Categoria
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleCancel}
                size="large"
              >
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
