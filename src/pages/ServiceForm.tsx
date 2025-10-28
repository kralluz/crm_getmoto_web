import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
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
import dayjs from 'dayjs';
import {
  useCreateServiceOrder,
  useUpdateServiceOrder,
  useServiceOrder
} from '../hooks/useServices';
import { useCustomers } from '../hooks/useCustomers';
import { VehicleSelect } from '../components/services/VehicleSelect';
import { ServiceCategorySelect } from '../components/services/ServiceCategorySelect';
import type {
  CreateServiceOrderData,
  UpdateServiceOrderData,
  ServiceOrderStatus
} from '../types/service-order';
import { PageHeader } from '../components/common/PageHeader';

const { Title, Text } = Typography;
const { TextArea } = Input;

export function ServiceForm() {
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
    { value: 'draft', label: 'Rascunho' },
    { value: 'in_progress', label: 'Em Progresso' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
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
        message.success('Ordem de serviço atualizada com sucesso!');
      } else {
        await createMutation.mutateAsync(formData);
        message.success('Ordem de serviço criada com sucesso!');
      }

      navigate('/servicos');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Erro ao salvar ordem de serviço');
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
      message.warning('Preencha todos os campos obrigatórios antes de continuar');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (isEditing && loadingServiceOrder) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Text>Carregando...</Text>
        </div>
      </Card>
    );
  }

  const steps = [
    {
      title: 'Veículo',
      description: 'Selecione o veículo',
    },
    {
      title: 'Ordem de Serviço',
      description: 'Dados do serviço',
    },
  ];

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
        subtitle={isEditing ? 'Atualize os dados da ordem de serviço' : 'Preencha os dados para criar uma nova ordem'}
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
            <Title level={4}>Informações do Veículo e Cliente</Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Veículo"
                  name="motorcycle_id"
                  rules={[{ required: true, message: 'Selecione um veículo' }]}
                >
                  <VehicleSelect />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Nome do Cliente"
                  name="customer_name"
                  rules={[{ required: true, message: 'Informe o nome do cliente' }]}
                >
                  <AutoComplete
                    options={customerOptions}
                    placeholder="Digite ou selecione o nome do cliente"
                    filterOption={(inputValue, option) =>
                      option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Space style={{ marginTop: 24 }}>
              <Button onClick={handleBack}>
                Cancelar
              </Button>
              <Button type="primary" onClick={handleNextStep} icon={<ArrowRightOutlined />}>
                Próximo
              </Button>
            </Space>
          </div>

          {/* STEP 2: Detalhes da Ordem de Serviço */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Title level={4}>Detalhes da Ordem de Serviço</Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Categoria de Serviço"
                  name="service_category_id"
                  rules={[{ required: true, message: 'Selecione a categoria do serviço' }]}
                >
                  <ServiceCategorySelect />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Nome do Profissional"
                  name="professional_name"
                >
                  <Input placeholder="Digite o nome do profissional responsável" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Custo Estimado da Mão de Obra (R$)"
                  name="estimated_labor_cost"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    precision={2}
                    placeholder="0,00"
                    prefix="R$"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Status"
                  name="status"
                  initialValue="draft"
                >
                  <Select placeholder="Selecione o status">
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
                    label="Data de Finalização"
                    name="finalized_at"
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      placeholder="Selecione a data de finalização"
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Form.Item
              label="Descrição do Serviço"
              name="service_description"
            >
              <TextArea
                rows={3}
                placeholder="Descreva o serviço a ser realizado"
              />
            </Form.Item>

            <Form.Item
              label="Diagnóstico"
              name="diagnosis"
            >
              <TextArea
                rows={3}
                placeholder="Diagnóstico do problema encontrado"
              />
            </Form.Item>

            <Form.Item
              label="Observações"
              name="notes"
            >
              <TextArea
                rows={2}
                placeholder="Observações adicionais"
              />
            </Form.Item>

            <Space style={{ marginTop: 24 }}>
              {!isEditing && (
                <Button onClick={handlePrevStep} icon={<ArrowLeftOutlined />}>
                  Voltar
                </Button>
              )}
              <Button onClick={handleBack}>
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                {isEditing ? 'Atualizar' : 'Criar'} Ordem de Serviço
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}
