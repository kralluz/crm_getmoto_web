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
  ExclamationCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useServiceOrder, useCancelServiceOrder, useUpdateServiceOrderNotes, useUpdateServiceOrderDescription } from '../hooks/useServices';
import { useAuthStore } from '../store/auth-store';
import { NotificationService } from '../services/notification.service';
import type { ServiceProduct, ServiceRealized, CashFlow } from '../types/service-order';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect } from 'react';
import { generateServiceOrderReport, generateCancelledServiceOrderReport } from '../utils/reports';
import { formatCurrency, formatDateTime, parseDecimal } from '../utils/format.util';
import { EditTextModal } from '../components/common/EditTextModal';

const { Title, Text } = Typography;

export function ServiceOrderDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serviceOrderId = id ? parseInt(id) : 0;

  const { data: serviceOrder, isLoading, error } = useServiceOrder(serviceOrderId);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelServiceOrder();
  const { mutate: updateNotes, isPending: isUpdatingNotes } = useUpdateServiceOrderNotes();
  const { mutate: updateDescription, isPending: isUpdatingDescription } = useUpdateServiceOrderDescription();
  const { user } = useAuthStore();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const [isEditDescriptionModalOpen, setIsEditDescriptionModalOpen] = useState(false);
  const [cancelForm] = Form.useForm();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detectar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGeneratePdf = async () => {
    if (!serviceOrder) return;

    setIsPdfLoading(true);
    try {
      // Se a ordem está cancelada, gera PDF de cancelamento
      if (serviceOrder.status === 'cancelled') {
        await generateCancelledServiceOrderReport(serviceOrder);
      } else {
        // Caso contrário, gera invoice normal
        await generateServiceOrderReport(serviceOrder);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1); // Volta para a página anterior
  };

  const handleCancelOrder = () => {
    if (serviceOrder?.status === 'cancelled') {
      NotificationService.warning(t('services.orderAlreadyCancelled'));
      return;
    }
    setIsCancelModalOpen(true);
  };

  const handleEditNotes = () => {
    setIsEditNotesModalOpen(true);
  };

  const handleSaveNotes = async (notes: string | null) => {
    return new Promise<void>((resolve, reject) => {
      updateNotes(
        { id: serviceOrderId, notes },
        {
          onSuccess: () => {
            setIsEditNotesModalOpen(false);
            resolve();
          },
          onError: (error: any) => {
            reject(error);
          },
        }
      );
    });
  };

  const handleEditDescription = () => {
    setIsEditDescriptionModalOpen(true);
  };

  const handleSaveDescription = async (service_description: string | null) => {
    return new Promise<void>((resolve, reject) => {
      updateDescription(
        { id: serviceOrderId, service_description },
        {
          onSuccess: () => {
            setIsEditDescriptionModalOpen(false);
            resolve();
          },
          onError: (error: any) => {
            reject(error);
          },
        }
      );
    });
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
    if (!serviceOrder) return { products: 0, services: 0, labor: 0, total: 0, discount: 0, grandTotal: 0 };

    // IMPORTANTE: Usar unit_price salvo no momento da venda, não o preço atual do cadastro
    const productsTotal = serviceOrder.service_products?.reduce((sum, product) => {
      const qty = parseDecimal(product.product_qtd);
      const price = parseDecimal(product.unit_price); // unit_price do momento da venda
      return sum + (qty * price);
    }, 0) || 0;

    const servicesTotal = serviceOrder.services_realized?.reduce((sum, service) => {
      const qty = parseDecimal(service.service_qtd);
      const cost = parseDecimal(service.unit_price); // unit_price do momento da venda
      return sum + (qty * cost);
    }, 0) || 0;

    const laborTotal = parseDecimal(serviceOrder.estimated_labor_cost);
    const subtotal = productsTotal + servicesTotal + laborTotal;

    // Calcular desconto
    let discountAmount = 0;
    if (serviceOrder.discount_amount) {
      discountAmount = parseDecimal(serviceOrder.discount_amount);
    } else if (serviceOrder.discount_percent) {
      discountAmount = subtotal * (parseDecimal(serviceOrder.discount_percent) / 100);
    }

    const grandTotal = subtotal - discountAmount;

    return { 
      products: productsTotal, 
      services: servicesTotal, 
      labor: laborTotal, 
      total: subtotal,
      discount: discountAmount,
      grandTotal: grandTotal
    };
  };

  // Colunas da tabela de produtos
  const productsColumns: ColumnsType<ServiceProduct> = [
    {
      title: <span style={{ color: '#1677ff' }}>{t('services.product')}</span>,
      dataIndex: ['products', 'product_name'],
      key: 'product_name',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as any,
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('services.quantity')}</span>,
      dataIndex: 'product_qtd',
      key: 'product_qtd',
      align: 'center',
      width: 100,
      responsive: ['sm', 'md', 'lg', 'xl'] as any,
      render: (qty: any) => parseDecimal(qty).toFixed(2),
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('services.unitPrice')}</span>,
      dataIndex: 'unit_price',
      key: 'unit_price',
      align: 'right',
      width: 120,
      responsive: ['md', 'lg', 'xl'] as any,
      render: (price: any) => formatCurrency(price),
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('common.total')}</span>,
      key: 'total',
      align: 'right',
      width: 120,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as any,
      render: (_, record) => {
        const qty = parseDecimal(record.product_qtd);
        const price = parseDecimal(record.unit_price);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{formatCurrency(qty * price)}</div>
            {isMobile && (
              <div style={{ fontSize: '11px', color: '#888' }}>
                {parseDecimal(record.product_qtd).toFixed(2)} × {formatCurrency(record.unit_price)}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  // Colunas da tabela de serviços realizados
  const servicesColumns: ColumnsType<ServiceRealized> = [
    {
      title: <span style={{ color: '#1677ff' }}>{t('services.service')}</span>,
      dataIndex: ['service', 'service_name'],
      key: 'service_name',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as any,
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('services.quantity')}</span>,
      dataIndex: 'service_qtd',
      key: 'service_qtd',
      align: 'center',
      width: 100,
      responsive: ['sm', 'md', 'lg', 'xl'] as any,
      render: (qty: any) => parseDecimal(qty),
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('services.unitPrice')}</span>,
      dataIndex: 'unit_price',
      key: 'unit_price',
      align: 'right',
      width: 120,
      responsive: ['md', 'lg', 'xl'] as any,
      render: (cost: any) => formatCurrency(cost),
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('common.total')}</span>,
      key: 'total',
      align: 'right',
      width: 120,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as any,
      render: (_, record) => {
        const qty = parseDecimal(record.service_qtd);
        const cost = parseDecimal(record.unit_price);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{formatCurrency(qty * cost)}</div>
            {isMobile && (
              <div style={{ fontSize: '11px', color: '#888' }}>
                {parseDecimal(record.service_qtd)} × {formatCurrency(record.unit_price)}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  // Colunas da tabela de movimentações financeiras
  const cashFlowColumns: ColumnsType<CashFlow> = [
    {
      title: <span style={{ color: '#1677ff' }}>{t('common.date')}</span>,
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      width: 140,
      responsive: ['md', 'lg', 'xl'] as any,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('cashflow.type')}</span>,
      dataIndex: 'direction',
      key: 'direction',
      align: 'center',
      width: 100,
      responsive: ['sm', 'md', 'lg', 'xl'] as any,
      render: (direction: 'entrada' | 'saida') => (
        <Tag color={direction === 'entrada' ? 'green' : 'red'}>
          {direction === 'entrada' ? t('cashflow.income') : t('cashflow.expense')}
        </Tag>
      ),
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('cashflow.amount')}</span>,
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 120,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as any,
      render: (amount: any, record) => (
        <Text style={{ color: record.direction === 'entrada' ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: <span style={{ color: '#1677ff' }}>{t('common.observations')}</span>,
      dataIndex: 'note',
      key: 'note',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as any,
      render: (note: string, record) => (
        <div>
          <div>{note}</div>
          {isMobile && (
            <div style={{ marginTop: 4 }}>
              <Tag color={record.direction === 'entrada' ? 'green' : 'red'} style={{ fontSize: '10px' }}>
                {record.direction === 'entrada' ? t('cashflow.income') : t('cashflow.expense')}
              </Tag>
              <Text type="secondary" style={{ fontSize: '11px', marginLeft: 4 }}>
                {formatDateTime(record.occurred_at)}
              </Text>
            </div>
          )}
        </div>
      ),
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          size="middle"
          title={t('common.back')}
        >
          {!isMobile && t('common.back')}
        </Button>
        <Space direction="horizontal">
          {serviceOrder.status !== 'cancelled' && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleCancelOrder}
              size="middle"
              style={{
                backgroundColor: '#ff4d4f',
                borderColor: '#ff4d4f',
                color: 'white'
              }}
              title={t('services.cancelOrder')}
            >
              {!isMobile && t('services.cancelOrder')}
            </Button>
          )}
          {serviceOrder.status !== 'cancelled' ? (
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleGeneratePdf}
              loading={isPdfLoading}
              size="middle"
              title={t('services.generateInvoice')}
            >
              {!isMobile && t('services.generateInvoice')}
            </Button>
          ) : (
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleGeneratePdf}
              loading={isPdfLoading}
              size="middle"
              danger
              title={t('services.downloadCancelledOrder')}
            >
              {!isMobile && t('services.downloadCancelledOrder')}
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space>
              <FileTextOutlined style={{ fontSize: 32, color: serviceOrder.status === 'cancelled' ? '#ff4d4f' : '#1677ff' }} />
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

          <Descriptions 
            bordered 
            column={{ xs: 1, sm: 1, md: 2 }}
            labelStyle={{ color: '#1677ff', fontWeight: 500 }}
            size={isMobile ? 'small' : 'default'}
          >
            <Descriptions.Item label={t('services.client')} span={2}>
              <Text strong style={{ fontSize: '15px' }}>{serviceOrder.customer_name || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('services.statusLabel')}>
              <Tag color={
                serviceOrder.status === 'completed' ? 'success' :
                serviceOrder.status === 'cancelled' ? 'error' :
                serviceOrder.status === 'in_progress' ? 'processing' : 'default'
              }>
                {t(`services.status.${serviceOrder.status}`)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('services.createdIn')}>
              <Text style={{ whiteSpace: 'nowrap' }}>{formatDateTime(serviceOrder.created_at)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('services.professionalLabel')} span={2}>
              <Text strong style={{ color: serviceOrder.professional_name ? '#52c41a' : undefined }}>
                {serviceOrder.professional_name || '-'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('services.vehicleLabel')} span={2}>
              {serviceOrder.vehicles ? (
                <Space direction="vertical" size={0}>
                  <Text strong style={{ fontSize: '15px' }}>
                    {serviceOrder.vehicles.brand} {serviceOrder.vehicles.model}
                  </Text>
                  <Space size="small" wrap>
                    <div
                      style={{
                        display: 'inline-flex',
                        border: '3px solid #000',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        height: '32px',
                      }}
                    >
                      {/* Faixa azul à esquerda */}
                      <div
                        style={{
                          width: '12px',
                          backgroundColor: '#0066cc',
                        }}
                      />
                      {/* Área branca com caracteres */}
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 8px',
                          fontFamily: '"Courier New", Courier, monospace',
                          fontSize: '15px',
                          fontWeight: 'bold',
                          letterSpacing: '2px',
                          color: '#000',
                          minWidth: '75px',
                        }}
                      >
                        {(() => {
                          const formattedPlate = serviceOrder.vehicles.plate?.toUpperCase().replace(/\s/g, '');
                          return formattedPlate?.length >= 7
                            ? `${formattedPlate.slice(0, 4)} ${formattedPlate.slice(4, 7)}`
                            : serviceOrder.vehicles.plate?.toUpperCase() || '';
                        })()}
                      </div>
                    </div>
                    <Text type="secondary">{serviceOrder.vehicles.year}</Text>
                    {serviceOrder.vehicles.color && <Tag>{serviceOrder.vehicles.color}</Tag>}
                  </Space>
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.mileAtService')} span={serviceOrder.finalized_at ? 1 : 2}>
              {serviceOrder.vehicle_mile ? (
                <Text strong style={{ fontSize: '16px', color: '#1677ff' }}>
                  {serviceOrder.vehicle_mile.toLocaleString('en-GB')} miles
                </Text>
              ) : (
                <Text type="secondary">-</Text>
              )}
            </Descriptions.Item>
            {serviceOrder.finalized_at && (
              <Descriptions.Item label={t('services.finalizedAt')}>
                <Text type="success" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(serviceOrder.finalized_at)}</Text>
              </Descriptions.Item>
            )}
            {(serviceOrder.discount_percent || serviceOrder.discount_amount) && (
              <Descriptions.Item label={t('services.discountLabel')} span={2}>
                <Space wrap>
                  <Tag color="orange" icon={<DollarOutlined />} style={{ whiteSpace: 'nowrap' }}>
                    {serviceOrder.discount_percent ? (
                      <>
                        {serviceOrder.discount_percent}% ({formatCurrency(totals.discount)})
                      </>
                    ) : (
                      formatCurrency(serviceOrder.discount_amount!)
                    )}
                  </Tag>
                  <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                    {serviceOrder.discount_percent 
                      ? t('services.percentDiscount') 
                      : t('services.fixedDiscount')}
                  </Text>
                </Space>
              </Descriptions.Item>
            )}
            <Descriptions.Item 
              label={
                <Space>
                  {t('services.serviceDescriptionLabel')}
                  {serviceOrder.status !== 'cancelled' && (
                    <EditOutlined 
                      onClick={handleEditDescription}
                      style={{ cursor: 'pointer', color: '#1677ff', fontSize: 14 }}
                      title={t('services.editDescription')}
                    />
                  )}
                </Space>
              } 
              span={2}
            >
              {serviceOrder.service_description || '-'}
            </Descriptions.Item>
            {serviceOrder.diagnosis && (
              <Descriptions.Item label={t('services.diagnosisLabel')} span={2}>
                {serviceOrder.diagnosis}
              </Descriptions.Item>
            )}
            <Descriptions.Item 
              label={
                <Space>
                  {t('services.observationsLabel')}
                  {serviceOrder.status !== 'cancelled' && (
                    <EditOutlined 
                      onClick={handleEditNotes}
                      style={{ cursor: 'pointer', color: '#1677ff', fontSize: 14 }}
                      title={t('common.editNotes')}
                    />
                  )}
                </Space>
              } 
              span={2}
            >
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
          </Descriptions>

          {/* Resumo Financeiro */}
          <Card 
            title={<><DollarOutlined style={{ color: '#1677ff' }} /> {t('services.financialSummary')}</>}
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
                  title={t('services.subtotal')}
                  value={totals.total}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
            </Row>
            {totals.discount > 0 && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={12} md={6}>
                  <Statistic
                    title={t('services.discountLabel')}
                    value={totals.discount}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix="-"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title={t('services.grandTotalLabel')}
                    value={totals.grandTotal}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: '24px' }}
                  />
                </Col>
              </Row>
            )}
            {totals.discount === 0 && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} md={6}>
                  <Statistic
                    title={t('services.grandTotalLabel')}
                    value={totals.grandTotal}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: '24px' }}
                  />
                </Col>
              </Row>
            )}
          </Card>

          {/* Produtos Utilizados */}
          {serviceOrder.service_products && serviceOrder.service_products.length > 0 && (
            <Card 
              title={<><ShoppingOutlined style={{ color: '#1677ff' }} /> {t('services.productsSoldLabel')}</>}
              style={{ marginTop: 24 }}
            >
              <Table
                columns={productsColumns}
                dataSource={serviceOrder.service_products}
                rowKey="service_product_id"
                pagination={false}
                size={isMobile ? 'small' : 'middle'}
                scroll={isMobile ? undefined : { x: 'max-content' }}
              />
            </Card>
          )}

          {/* Serviços Realizados */}
          {serviceOrder.services_realized && serviceOrder.services_realized.length > 0 && (
            <Card 
              title={<><ToolOutlined style={{ color: '#1677ff' }} /> {t('services.servicesRealizedLabel')}</>}
              style={{ marginTop: 24 }}
            >
              <Table
                columns={servicesColumns}
                dataSource={serviceOrder.services_realized}
                rowKey="services_realized_id"
                pagination={false}
                size={isMobile ? 'small' : 'middle'}
                scroll={isMobile ? undefined : { x: 'max-content' }}
              />
            </Card>
          )}

          {/* Movimentações Financeiras */}
          {serviceOrder.cash_flow && serviceOrder.cash_flow.length > 0 && (
            <Card 
              title={<><DollarOutlined style={{ color: '#1677ff' }} /> {t('services.financialMovements')}</>}
              style={{ marginTop: 24 }}
            >
              <Table
                columns={cashFlowColumns}
                dataSource={serviceOrder.cash_flow}
                rowKey="cash_flow_id"
                pagination={false}
                size={isMobile ? 'small' : 'middle'}
                scroll={isMobile ? undefined : { x: 'max-content' }}
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

      {/* Edit Description Modal */}
      <EditTextModal
        open={isEditDescriptionModalOpen}
        title={t('services.editDescription')}
        label={t('services.serviceDescription')}
        fieldName="service_description"
        initialValue={serviceOrder?.service_description}
        onCancel={() => setIsEditDescriptionModalOpen(false)}
        onSave={handleSaveDescription}
        isLoading={isUpdatingDescription}
        required={false}
        minLength={5}
        maxLength={500}
        placeholder={t('services.descriptionPlaceholder')}
        multiline={true}
        rows={4}
      />

      {/* Edit Notes Modal */}
      <EditTextModal
        open={isEditNotesModalOpen}
        title={t('common.editNotes')}
        label={t('common.notes')}
        fieldName="notes"
        initialValue={serviceOrder?.notes}
        onCancel={() => setIsEditNotesModalOpen(false)}
        onSave={handleSaveNotes}
        isLoading={isUpdatingNotes}
        required={false}
        maxLength={500}
        placeholder={t('services.notesPlaceholder')}
        multiline={true}
        rows={4}
      />
    </div>
  );
}
