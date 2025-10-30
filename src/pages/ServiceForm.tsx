import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  message,
  Row,
  Col,
  DatePicker,
  AutoComplete,
  Steps,
  Divider
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  useCreateServiceOrder,
  useUpdateServiceOrder,
  useServiceOrder
} from '../hooks/useServices';
import { useCustomers } from '../hooks/useCustomers';
import { VehicleSelect } from '../components/services/VehicleSelect';
import { ServiceCategorySelect } from '../components/services/ServiceCategorySelect';
import { CurrencyInput } from '../components/common/CurrencyInput';
import type {
  CreateServiceOrderData,
  UpdateServiceOrderData,
  ServiceOrderStatus
} from '../types/service-order';
import { PageHeader } from '../components/common/PageHeader';

const { Title, Text } = Typography;
const { TextArea } = Input;

export function ServiceForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isEditing = !!id;
  const serviceOrderId = id ? parseInt(id) : undefined;

  // Hooks para dados
  const { data: serviceOrder, isLoading: loadingServiceOrder } = useServiceOrder(serviceOrderId!);
  const { data: customers } = useCustomers();

  // Mutations
  const createMutation = useCreateServiceOrder();
  const updateMutation = useUpdateServiceOrder();

  // Opções de autocomplete para clientes
  const customerOptions = customers?.map(customer => ({
    value: customer.name,
    label: `${customer.name} - ${customer.phone}`,
  })) || [];

  // Opções de status
  const statusOptions: { value: ServiceOrderStatus; label: string }[] = [
    { value: 'draft', label: t('services.status.draft') },
    { value: 'in_progress', label: t('services.status.in_progress') },
    { value: 'completed', label: t('services.status.completed') },
    { value: 'cancelled', label: t('services.status.cancelled') },
  ];

  // Carregar dados do formulário quando editing
  useEffect(() => {
    if (isEditing && serviceOrder) {
      form.setFieldsValue({
        service_category_id: serviceOrder.service_category_id,
        professional_name: serviceOrder.professional_name,
        motorcycle_id: serviceOrder.motorcycle_id,
        customer_name: serviceOrder.customer_name,
        service_description: serviceOrder.service_description,
        diagnosis: serviceOrder.diagnosis,
        status: serviceOrder.status,
        estimated_labor_cost: serviceOrder.estimated_labor_cost,
        notes: serviceOrder.notes,
        finalized_at: serviceOrder.finalized_at ? dayjs(serviceOrder.finalized_at) : undefined,
      });
      // Se está editando, pula para o step de detalhes
      setCurrentStep(1);
    }
  }, [isEditing, serviceOrder, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Preparar dados para submissão
      const formData: CreateServiceOrderData | UpdateServiceOrderData = {
        service_category_id: values.service_category_id,
        professional_name: values.professional_name,
        motorcycle_id: values.motorcycle_id,
        customer_name: values.customer_name,
        service_description: values.service_description,
        diagnosis: values.diagnosis,
        status: values.status || 'draft',
        estimated_labor_cost: values.estimated_labor_cost,
        notes: values.notes,
        finalized_at: values.finalized_at ? values.finalized_at.toISOString() : null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: serviceOrderId!,
          data: formData
        });
        message.success(t('services.orderUpdatedSuccess'));
      } else {
        await createMutation.mutateAsync(formData);
        message.success(t('services.orderCreatedSuccess'));
      }

      navigate('/servicos');
    } catch (error: any) {
      message.error(error?.response?.data?.message || t('services.orderSaveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/servicos');
  };

  const handleNextStep = async () => {
    try {
      // Validar campos do step atual
      if (currentStep === 0) {
        await form.validateFields(['motorcycle_id', 'customer_name']);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.warning(t('services.fillRequiredFields'));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (isEditing && loadingServiceOrder) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Text>{t('common.loading')}</Text>
        </div>
      </Card>
    );
  }

  const steps = [
    {
      title: t('services.vehicleStep'),
      description: t('services.vehicleStepDescription'),
    },
    {
      title: t('services.serviceOrderStep'),
      description: t('services.serviceOrderStepDescription'),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isEditing ? t('services.editOrder') : t('services.newOrder')}
        subtitle={isEditing ? t('services.editOrderSubtitle') : t('services.newOrderSubtitle')}
      />

      <Card>
        {!isEditing && (
          <>
            <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />
            <Divider />
          </>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* STEP 1: Seleção de Veículo e Cliente */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Title level={4}>{t('services.vehicleClientInfo')}</Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('services.vehicle')}
                  name="motorcycle_id"
                  rules={[{ required: true, message: t('services.vehicleRequired') }]}
                >
                  <VehicleSelect />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('services.customerName')}
                  name="customer_name"
                  rules={[{ required: true, message: t('services.customerNameRequired') }]}
                >
                  <AutoComplete
                    options={customerOptions}
                    placeholder={t('services.customerNamePlaceholder')}
                    filterOption={(inputValue, option) =>
                      option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Space style={{ marginTop: 24 }}>
              <Button onClick={handleBack}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" onClick={handleNextStep} icon={<ArrowRightOutlined />}>
                {t('services.next')}
              </Button>
            </Space>
          </div>

          {/* STEP 2: Detalhes da Ordem de Serviço */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Title level={4}>{t('services.serviceOrderDetails')}</Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('services.serviceCategory')}
                  name="service_category_id"
                  rules={[{ required: true, message: t('services.serviceCategoryRequired') }]}
                >
                  <ServiceCategorySelect />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('services.professionalName')}
                  name="professional_name"
                >
                  <Input placeholder={t('services.professionalPlaceholder')} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('services.estimatedLaborCost')}
                  name="estimated_labor_cost"
                >
                  <CurrencyInput
                    style={{ width: '100%' }}
                    placeholder="R$ 0,00"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('table.status')}
                  name="status"
                  initialValue="draft"
                >
                  <Select placeholder={t('services.selectStatus')}>
                    {statusOptions.map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {isEditing && (
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('services.finalizationDate')}
                    name="finalized_at"
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      placeholder={t('services.finalizationDatePlaceholder')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Form.Item
              label={t('services.serviceDescription')}
              name="service_description"
            >
              <TextArea
                rows={3}
                placeholder={t('services.serviceDescriptionPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              label={t('services.diagnosis')}
              name="diagnosis"
            >
              <TextArea
                rows={3}
                placeholder={t('services.diagnosisPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              label={t('services.notes')}
              name="notes"
            >
              <TextArea
                rows={2}
                placeholder={t('services.notesPlaceholder')}
              />
            </Form.Item>

            <Space style={{ marginTop: 24 }}>
              {!isEditing && (
                <Button onClick={handlePrevStep} icon={<ArrowLeftOutlined />}>
                  {t('services.previous')}
                </Button>
              )}
              <Button onClick={handleBack}>
                {t('common.cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                {isEditing ? t('services.updateOrder') : t('services.createOrder')}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}
