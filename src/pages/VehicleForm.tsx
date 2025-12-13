import { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Card,
  Space,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader';
import {
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
} from '../hooks/useMotorcycles';
import type {
  CreateMotorcycleData,
  UpdateMotorcycleData,
} from '../types/motorcycle';

export function VehicleForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [form] = Form.useForm();

  const { data: vehicle, isLoading: vehicleLoading, refetch } = useVehicle(
    isEditing ? parseInt(id!) : undefined
  );
  const { mutate: createVehicle, isPending: isCreating } = useCreateVehicle();
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdateVehicle();

  // Apenas mostrar loading quando estiver editando e carregando dados
  const isLoading = isEditing && vehicleLoading;

  useEffect(() => {
    if (vehicle && isEditing) {
      form.setFieldsValue({
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        plate: vehicle.plate,
        year: vehicle.year,
        mile: vehicle.mile,
        is_active: vehicle.is_active,
      });
    }
  }, [vehicle, isEditing, form]);

  const handleSubmit = (values: CreateMotorcycleData | UpdateMotorcycleData) => {
    if (isEditing) {
      // Permitir apenas atualização da quilometragem
      const updateData = {
        mile: values.mile,
      };
      updateVehicle(
        { id: parseInt(id!), data: updateData },
        {
          onSuccess: async () => {
            // Recarregar dados do veículo para mostrar valores atualizados
            await refetch();
            // Pequeno delay para garantir que a UI atualize
            setTimeout(() => {
              navigate('/veiculos');
            }, 100);
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
        title={isEditing ? t('vehicles.editVehicle') : t('vehicles.newVehicle')}
        subtitle={
          isEditing
            ? t('vehicles.updateVehicleSubtitle')
            : t('vehicles.registerNewVehicleSubtitle')
        }
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
                label={t('vehicles.plate')}
                name="plate"
                rules={isEditing ? [] : [
                  {
                    required: true,
                    message: t('vehicles.plateRequired'),
                  },
                  {
                    pattern: /^[A-Z]{2}\d{2}\s?[A-Z]{3}$/,
                    message: t('vehicles.plateInvalidFormat'),
                  },
                ]}
              >
                <Input
                  placeholder="AB12 CDE"
                  maxLength={8}
                  style={{ textTransform: 'uppercase' }}
                  disabled={isEditing}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    
                    // Aplicar máscara: AA00 AAA
                    if (value.length > 4) {
                      value = value.slice(0, 4) + ' ' + value.slice(4, 7);
                    }
                    
                    form.setFieldValue('plate', value);
                    // Validar o campo imediatamente após a mudança
                    form.validateFields(['plate']).catch(() => {});
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.brand')}
                name="brand"
                rules={isEditing ? [] : [
                  {
                    required: true,
                    message: t('vehicles.brandRequired'),
                  },
                  {
                    validator: (_, value) => {
                      if (!value || value.trim().length === 0) {
                        return Promise.reject(new Error(t('vehicles.brandRequired')));
                      }
                      if (value.trim().length < 2) {
                        return Promise.reject(new Error(t('vehicles.brandMinLengthError')));
                      }
                      if (value.length > 100) {
                        return Promise.reject(new Error(t('vehicles.brandMaxLengthError')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder={t('vehicles.brandPlaceholder')}
                  maxLength={100}
                  disabled={isEditing}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.model')}
                name="model"
                rules={isEditing ? [] : [
                  {
                    required: true,
                    message: t('vehicles.modelRequired'),
                  },
                  {
                    validator: (_, value) => {
                      if (!value || value.trim().length === 0) {
                        return Promise.reject(new Error(t('vehicles.modelRequired')));
                      }
                      if (value.trim().length < 2) {
                        return Promise.reject(new Error(t('vehicles.modelMinLengthError')));
                      }
                      if (value.length > 100) {
                        return Promise.reject(new Error(t('vehicles.modelMaxLengthError')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder={t('vehicles.modelPlaceholder')}
                  maxLength={100}
                  disabled={isEditing}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.color')}
                name="color"
                rules={isEditing ? [] : [
                  {
                    validator: (_, value) => {
                      if (!value || value.trim().length === 0) {
                        return Promise.resolve(); // Campo opcional
                      }
                      if (value.trim().length < 2) {
                        return Promise.reject(new Error(t('vehicles.colorMinLengthError')));
                      }
                      if (value.length > 50) {
                        return Promise.reject(new Error(t('vehicles.colorMaxLengthError')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder={t('vehicles.colorPlaceholder')}
                  maxLength={50}
                  disabled={isEditing}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.year')}
                name="year"
                rules={isEditing ? [] : [
                  {
                    required: true,
                    message: t('vehicles.yearRequired'),
                  },
                  {
                    validator: (_, value) => {
                      if (value === null || value === undefined) {
                        return Promise.reject(new Error(t('vehicles.yearRequired')));
                      }
                      if (value < 1900) {
                        return Promise.reject(new Error(t('vehicles.invalidYearError')));
                      }
                      if (value > new Date().getFullYear() + 1) {
                        return Promise.reject(new Error(t('vehicles.futureYearError')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  placeholder={t('vehicles.yearPlaceholder')}
                  style={{ width: '100%' }}
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  disabled={isEditing}
                  parser={(value) => {
                    const parsed = Number(value);
                    const maxYear = new Date().getFullYear() + 1;
                    if (isNaN(parsed) || parsed < 1900) return 1900;
                    if (parsed > maxYear) return maxYear;
                    return parsed;
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.mile')}
                name="mile"
                rules={[
                  {
                    required: true,
                    message: t('vehicles.mileRequired'),
                  },
                  {
                    validator: (_, value) => {
                      if (value === null || value === undefined) {
                        return Promise.reject(new Error(t('vehicles.mileRequired')));
                      }
                      if (value < 0) {
                        return Promise.reject(new Error(t('vehicles.mileNegativeError')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                validateTrigger={['onChange', 'onBlur']}
              >
                <InputNumber
                  placeholder={t('vehicles.milePlaceholder')}
                  style={{ width: '100%' }}
                  status={form.getFieldError('mile').length > 0 ? 'error' : undefined}
                  keyboard={true}
                  onBlur={() => {
                    form.validateFields(['mile']);
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('common.status')}
                name="is_active"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren={t('common.active')}
                  unCheckedChildren={t('common.inactive')}
                  disabled={isEditing}
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
                {isEditing ? t('common.update') : t('common.register')}
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleCancel}
                disabled={isCreating || isUpdating}
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
