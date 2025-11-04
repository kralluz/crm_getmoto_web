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
                rules={[
                  {
                    required: true,
                    message: t('vehicles.plateRequiredError'),
                  },
                  {
                    min: 7,
                    message: t('vehicles.plateMinLengthError'),
                  },
                  {
                    max: 10,
                    message: t('vehicles.plateMaxLengthError'),
                  },
                ]}
              >
                <Input
                  placeholder={t('vehicles.platePlaceholder')}
                  maxLength={10}
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.brand')}
                name="brand"
                rules={[
                  {
                    min: 2,
                    message: t('vehicles.brandMinLengthError'),
                  },
                  {
                    max: 100,
                    message: t('vehicles.brandMaxLengthError'),
                  },
                ]}
              >
                <Input
                  placeholder={t('vehicles.brandPlaceholder')}
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.model')}
                name="model"
                rules={[
                  {
                    min: 2,
                    message: t('vehicles.modelMinLengthError'),
                  },
                  {
                    max: 100,
                    message: t('vehicles.modelMaxLengthError'),
                  },
                ]}
              >
                <Input
                  placeholder={t('vehicles.modelPlaceholder')}
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.color')}
                name="color"
                rules={[
                  {
                    min: 2,
                    message: t('vehicles.colorMinLengthError'),
                  },
                  {
                    max: 50,
                    message: t('vehicles.colorMaxLengthError'),
                  },
                ]}
              >
                <Input
                  placeholder={t('vehicles.colorPlaceholder')}
                  maxLength={50}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label={t('vehicles.year')}
                name="year"
                rules={[
                  {
                    type: 'number',
                    min: 1900,
                    message: t('vehicles.invalidYearError'),
                  },
                  {
                    type: 'number',
                    max: new Date().getFullYear() + 1,
                    message: t('vehicles.futureYearError'),
                  },
                ]}
              >
                <InputNumber
                  placeholder={t('vehicles.yearPlaceholder')}
                  style={{ width: '100%' }}
                  min={1900}
                  max={new Date().getFullYear() + 1}
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
