import { useEffect } from 'react';
import { Form, Input, Switch, Button, Card, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { CurrencyInput } from '../components/common/CurrencyInput';
import {
  useServiceCategory,
  useCreateServiceCategory,
  useUpdateServiceCategory,
} from '../hooks/useServiceCategories';
import type { CreateServiceCategoryData, UpdateServiceCategoryData } from '../types/service-category';
import { parseDecimal } from '../utils';

export function ServiceCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
                  errors: ['Já existe uma categoria com este nome'],
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
                errors: ['Já existe um serviço com este nome'],
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
        title={isEditing ? 'Editar Serviço' : 'Novo Serviço'}
        subtitle={isEditing ? 'Atualize os dados do serviço' : 'Preencha os dados do novo serviço'}
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
            label="Nome do Serviço"
            name="service_name"
            rules={[
              { required: true, message: 'Por favor, informe o nome do serviço' },
              { min: 3, message: 'O nome deve ter no mínimo 3 caracteres' },
              { max: 255, message: 'O nome deve ter no máximo 255 caracteres' },
            ]}
          >
            <Input
              placeholder="Ex: Troca de Óleo, Revisão Completa, Troca de Pneus"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Custo do Serviço (R$)"
            name="service_cost"
            rules={[
              { required: true, message: 'Por favor, informe o custo do serviço' },
              {
                type: 'number',
                min: 0,
                message: 'O custo deve ser maior ou igual a zero',
              },
            ]}
          >
            <CurrencyInput
              placeholder="R$ 0,00"
              style={{ width: '100%' }}
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
                {isEditing ? 'Atualizar' : 'Criar'} Serviço
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
