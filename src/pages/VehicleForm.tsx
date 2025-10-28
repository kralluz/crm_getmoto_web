import { useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, Card, Space, Row, Col } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import {
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
} from '../hooks/useMotorcycles';
import type { CreateMotorcycleData, UpdateMotorcycleData } from '../types/motorcycle';

export function VehicleForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [form] = Form.useForm();

  const { data: vehicle, isLoading } = useVehicle(
    isEditing ? parseInt(id!) : undefined
  );
  const { mutate: createVehicle, isPending: isCreating } = useCreateVehicle();
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdateVehicle();

  useEffect(() => {
    if (vehicle && isEditing) {
      form.setFieldsValue({
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        plate: vehicle.plate,
        year: vehicle.year,
        is_active: vehicle.is_active,
      });
    }
  }, [vehicle, isEditing, form]);

  const handleSubmit = (values: CreateMotorcycleData | UpdateMotorcycleData) => {
    if (isEditing) {
      updateVehicle(
        { id: parseInt(id!), data: values },
        {
          onSuccess: () => {
            navigate('/veiculos');
          },
        }
      );
    } else {
      createVehicle(values as CreateMotorcycleData, {
        onSuccess: () => {
          navigate('/veiculos');
        },
      });
    }
  };

  const handleCancel = () => {
    navigate('/veiculos');
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Editar Veículo' : 'Novo Veículo'}
        subtitle={isEditing ? 'Atualize os dados do veículo' : 'Cadastre um novo veículo no sistema'}
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
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Placa"
                name="plate"
                rules={[
                  { required: true, message: 'Por favor, informe a placa' },
                  { min: 7, message: 'A placa deve ter no mínimo 7 caracteres' },
                  { max: 10, message: 'A placa deve ter no máximo 10 caracteres' },
                ]}
              >
                <Input
                  placeholder="ABC-1234 ou ABC1D23"
                  maxLength={10}
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Marca"
                name="brand"
                rules={[
                  { min: 2, message: 'A marca deve ter no mínimo 2 caracteres' },
                  { max: 100, message: 'A marca deve ter no máximo 100 caracteres' },
                ]}
              >
                <Input placeholder="Ex: Honda, Yamaha, Suzuki" maxLength={100} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Modelo"
                name="model"
                rules={[
                  { min: 2, message: 'O modelo deve ter no mínimo 2 caracteres' },
                  { max: 100, message: 'O modelo deve ter no máximo 100 caracteres' },
                ]}
              >
                <Input placeholder="Ex: CG 160, Factor 150" maxLength={100} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Cor"
                name="color"
                rules={[
                  { min: 2, message: 'A cor deve ter no mínimo 2 caracteres' },
                  { max: 50, message: 'A cor deve ter no máximo 50 caracteres' },
                ]}
              >
                <Input placeholder="Ex: Vermelha, Preta" maxLength={50} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Ano"
                name="year"
                rules={[
                  {
                    type: 'number',
                    min: 1900,
                    message: 'Ano inválido',
                  },
                  {
                    type: 'number',
                    max: new Date().getFullYear() + 1,
                    message: 'Ano no futuro não permitido',
                  },
                ]}
              >
                <InputNumber
                  placeholder="Ex: 2023"
                  style={{ width: '100%' }}
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
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
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isCreating || isUpdating}
              >
                {isEditing ? 'Atualizar' : 'Cadastrar'}
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleCancel}
                disabled={isCreating || isUpdating}
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
