import { 
  Card, 
  Descriptions, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  Divider, 
  Table, 
  Row, 
  Col,
  Statistic,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  Alert
} from 'antd';
import { 
  ArrowLeftOutlined, 
  FileTextOutlined, 
  StopOutlined, 
  ToolOutlined,
  ShoppingOutlined,
  DollarOutlined,
  FilePdfOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useServiceOrder, useCancelServiceOrder } from '../hooks/useServices';
import { useAuthStore } from '../store/auth-store';
import { NotificationService } from '../services/notification.service';
import type { ServiceProduct, ServiceRealized, CashFlow } from '../types/service-order';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect } from 'react';
import { generateServiceOrderReport } from '../utils/reports';
import { formatCurrency, formatDateTime, parseDecimal } from '../utils/format.util';

const { Title, Text } = Typography;

export function ServiceOrderDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const serviceOrderId = id ? parseInt(id) : 0;

  const { data: serviceOrder, isLoading, error } = useServiceOrder(serviceOrderId);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelServiceOrder();
  const { user } = useAuthStore();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelForm] = Form.useForm();
  const [cameFromSearch, setCameFromSearch] = useState(false);

  // Detectar se veio da página de busca
  useEffect(() => {
    const fromSearch = location.state?.fromSearch;
    setCameFromSearch(fromSearch);
  }, [location]);

  const handleGeneratePdf = async () => {
    if (!serviceOrder) return;

    setIsPdfLoading(true);
    try {
      await generateServiceOrderReport(serviceOrder);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleBack = () => {
    if (cameFromSearch) {
      navigate(-1); // Volta para a página de busca
    } else {
      navigate('/servicos'); // Volta para a lista de serviços
    }
  };

  const handleCancelOrder = () => {
    if (serviceOrder?.status === 'cancelled') {
      NotificationService.warning(t('services.orderAlreadyCancelled'));
      return;
    }
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      const values = await cancelForm.validateFields();
      
      if (!user || !user.id) {
        NotificationService.error(t('common.error'), t('auth.userNotFound'));
        return;
      }

      const cancelledBy = parseInt(user.id, 10);
      
      if (isNaN(cancelledBy)) {
        NotificationService.error(t('common.error'), 'ID de usuário inválido');
        return;
      }

      cancelOrder(
        {
          id: serviceOrderId,
          cancelled_by: cancelledBy,
          cancellation_reason: values.cancellation_reason,
        },
        {
          onSuccess: () => {
            NotificationService.success(t('services.orderCancelledSuccess'));
            setIsCancelModalOpen(false);
            cancelForm.resetFields();
            // Redireciona após 1 segundo para o usuário ver a mensagem
            setTimeout(() => navigate('/servicos'), 1000);
          },
          onError: (error: any) => {
            NotificationService.error(
              error?.response?.data?.message || t('services.orderCancelError')
            );
          },
        }
      );
    } catch (error) {
      console.error('Erro na validação do formulário:', error);
    }
  };

  // Calcular totais
  const calculateTotals = () => {
    if (!serviceOrder) return { products: 0, services: 0, labor: 0, total: 0 };

    const productsTotal = serviceOrder.service_products?.reduce((sum, product) => {
      const qty = parseDecimal(product.product_qtd);
      const price = parseDecimal(product.products.sell_price);
      return sum + (qty * price);
    }, 0) || 0;

    const servicesTotal = serviceOrder.services_realized?.reduce((sum, service) => {
      const qty = parseDecimal(service.service_qtd);
      const cost = parseDecimal(service.service.service_cost);
      return sum + (qty * cost);
    }, 0) || 0;

    const laborTotal = parseDecimal(serviceOrder.estimated_labor_cost);
    const total = productsTotal + servicesTotal + laborTotal;

    return { products: productsTotal, services: servicesTotal, labor: laborTotal, total };
  };

  // Colunas da tabela de produtos
  const productsColumns: ColumnsType<ServiceProduct> = [
    {
      title: t('services.product'),
      dataIndex: ['products', 'product_name'],
      key: 'product_name',
    },
    {
      title: t('services.quantity'),
      dataIndex: 'product_qtd',
      key: 'product_qtd',
      align: 'center',
      render: (qty: any) => parseDecimal(qty).toFixed(2),
    },
    {
      title: t('services.unitPrice'),
      dataIndex: ['products', 'sell_price'],
      key: 'sell_price',
      align: 'right',
      render: (price: any) => formatCurrency(price),
    },
    {
      title: t('common.total'),
      key: 'total',
      align: 'right',
      render: (_, record) => {
        const qty = parseDecimal(record.product_qtd);
        const price = parseDecimal(record.products.sell_price);
        return formatCurrency(qty * price);
      },
    },
  ];

  // Colunas da tabela de serviços realizados
  const servicesColumns: ColumnsType<ServiceRealized> = [
    {
      title: t('services.service'),
      dataIndex: ['service', 'service_name'],
      key: 'service_name',
    },
    {
      title: t('services.quantity'),
      dataIndex: 'service_qtd',
      key: 'service_qtd',
      align: 'center',
      render: (qty: any) => parseDecimal(qty),
    },
    {
      title: t('services.unitPrice'),
      dataIndex: ['service', 'service_cost'],
      key: 'service_cost',
      align: 'right',
      render: (cost: any) => formatCurrency(cost),
    },
    {
      title: t('common.total'),
      key: 'total',
      align: 'right',
      render: (_, record) => {
        const qty = parseDecimal(record.service_qtd);
        const cost = parseDecimal(record.service.service_cost);
        return formatCurrency(qty * cost);
      },
    },
  ];

  // Colunas da tabela de movimentações financeiras
  const cashFlowColumns: ColumnsType<CashFlow> = [
    {
      title: t('common.date'),
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('cashflow.type'),
      dataIndex: 'direction',
      key: 'direction',
      align: 'center',
      render: (direction: 'entrada' | 'saida') => (
        <Tag color={direction === 'entrada' ? 'green' : 'red'}>
          {direction === 'entrada' ? t('cashflow.income') : t('cashflow.expense')}
        </Tag>
      ),
    },
    {
      title: t('cashflow.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: any, record) => (
        <Text style={{ color: record.direction === 'entrada' ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: t('common.observations'),
      dataIndex: 'note',
      key: 'note',
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !serviceOrder) {
    return (
      <div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ marginBottom: 16 }}
        >
          {t('common.back')}
        </Button>
        <Empty description={t('services.serviceNotFound')} />
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
        >
          {t('common.back')}
        </Button>
        <Space>
          {serviceOrder.status !== 'cancelled' && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleCancelOrder}
              style={{ 
                backgroundColor: '#ff4d4f', 
                borderColor: '#ff4d4f',
                color: 'white'
              }}
            >
              {t('services.cancelOrder')}
            </Button>
          )}
          <Button
            icon={<FilePdfOutlined />}
            onClick={handleGeneratePdf}
            loading={isPdfLoading}
          >
            {t('services.generateInvoice')}
          </Button>
        </Space>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space>
              <FileTextOutlined style={{ fontSize: 32, color: serviceOrder.status === 'cancelled' ? '#ff4d4f' : '#13c2c2' }} />
              <div>
                <Space direction="vertical" size={0}>
                  <Space>
                    <Title level={2} style={{ margin: 0 }}>
                      {t('services.serviceOrderNumber')} #{serviceOrder.service_order_id}
                    </Title>
                    {serviceOrder.status === 'cancelled' && (
                      <Tag color="error" icon={<StopOutlined />}>
                        {t('services.cancelledLabel')}
                      </Tag>
                    )}
                  </Space>
                  <Text type="secondary">
                    {t('services.createdOn')} {formatDateTime(serviceOrder.created_at)}
                  </Text>
                  {serviceOrder.status === 'cancelled' && serviceOrder.cancelled_at && (
                    <Text type="danger">
                      {t('services.cancelledOn')} {formatDateTime(serviceOrder.cancelled_at)}
                    </Text>
                  )}
                </Space>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label={t('services.client')}>
              <Text strong>{serviceOrder.customer_name || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('services.professionalLabel')}>
              <Text strong>{serviceOrder.professional_name || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('services.vehicleLabel')}>
              {serviceOrder.vehicles ? (
                <div>
                  <Text strong>
                    {serviceOrder.vehicles.brand} {serviceOrder.vehicles.model}
                  </Text>
                  <br />
                  <Text type="secondary">
                    {serviceOrder.vehicles.plate} - {serviceOrder.vehicles.year}
                    {serviceOrder.vehicles.color && ` - ${serviceOrder.vehicles.color}`}
                  </Text>
                </div>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('services.serviceDescriptionLabel')} span={2}>
              {serviceOrder.service_description || '-'}
            </Descriptions.Item>
            {serviceOrder.diagnosis && (
              <Descriptions.Item label={t('services.diagnosisLabel')} span={2}>
                {serviceOrder.diagnosis}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('services.observationsLabel')} span={2}>
              {serviceOrder.notes || '-'}
            </Descriptions.Item>
            {serviceOrder.status === 'cancelled' && serviceOrder.cancellation_reason && (
              <Descriptions.Item label={t('services.cancellationReasonLabel')} span={2}>
                <Alert
                  message={serviceOrder.cancellation_reason}
                  type="error"
                  showIcon
                  icon={<StopOutlined />}
                />
              </Descriptions.Item>
            )}
            {serviceOrder.discount_percent && (
              <Descriptions.Item label={t('services.discountPercentLabel')}>
                {serviceOrder.discount_percent}%
              </Descriptions.Item>
            )}
            {serviceOrder.discount_amount && (
              <Descriptions.Item label={t('services.discountAmountLabel')}>
                {formatCurrency(serviceOrder.discount_amount)}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Resumo Financeiro */}
          <Card 
            title={<><DollarOutlined /> {t('services.financialSummary')}</>}
            style={{ marginTop: 24 }}
          >
            <Row gutter={16}>
              <Col xs={12} md={6}>
                <Statistic
                  title={t('services.totalProducts')}
                  value={totals.products}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title={t('services.totalServicesLabel')}
                  value={totals.services}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title={t('services.laborCostLabel')}
                  value={totals.labor}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title={t('services.grandTotalLabel')}
                  value={totals.total}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Produtos Utilizados */}
          {serviceOrder.service_products && serviceOrder.service_products.length > 0 && (
            <Card 
              title={<><ShoppingOutlined /> {t('services.productsSoldLabel')}</>}
              style={{ marginTop: 24 }}
            >
              <Table
                columns={productsColumns}
                dataSource={serviceOrder.service_products}
                rowKey="service_product_id"
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {/* Serviços Realizados */}
          {serviceOrder.services_realized && serviceOrder.services_realized.length > 0 && (
            <Card 
              title={<><ToolOutlined /> {t('services.servicesRealizedLabel')}</>}
              style={{ marginTop: 24 }}
            >
              <Table
                columns={servicesColumns}
                dataSource={serviceOrder.services_realized}
                rowKey="services_realized_id"
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {/* Movimentações Financeiras */}
          {serviceOrder.cash_flow && serviceOrder.cash_flow.length > 0 && (
            <Card 
              title={<><DollarOutlined /> {t('services.financialMovements')}</>}
              style={{ marginTop: 24 }}
            >
              <Table
                columns={cashFlowColumns}
                dataSource={serviceOrder.cash_flow}
                rowKey="cash_flow_id"
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </Space>
      </Card>

      {/* Cancellation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            {t('services.confirmCancellation')}
          </Space>
        }
        open={isCancelModalOpen}
        onCancel={() => {
          setIsCancelModalOpen(false);
          cancelForm.resetFields();
        }}
        onOk={handleConfirmCancel}
        confirmLoading={isCancelling}
        okText={t('services.confirmCancel')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message={t('services.cancellationWarning')}
            description={t('services.cancellationExplanation')}
            type="warning"
            showIcon
          />
          
          <Form form={cancelForm} layout="vertical">
            <Form.Item
              name="cancellation_reason"
              label={t('services.cancellationReason')}
              rules={[
                { required: true, message: t('services.cancellationReasonRequired') },
                { min: 10, message: t('services.cancellationReasonMinLength') }
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder={t('services.cancellationReasonPlaceholder')}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </div>
  );
}
