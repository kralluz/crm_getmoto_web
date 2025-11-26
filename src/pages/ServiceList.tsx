import { useState, useMemo, useEffect } from 'react';
import { Table, Card, Input, Typography, Select, Button, Alert, Row, Col, Space, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined, UserOutlined, CarOutlined, CalendarOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useServiceOrders } from '../hooks/useServices';
import { ServiceOrderModal } from '../components/services/ServiceOrderModal';
import { PageHeader } from '../components/common/PageHeader';
import type { ServiceOrder, ServiceOrderStatus } from '../types/service-order';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useHideCancelled } from '../hooks/useHideCancelled';
import { HideCancelledCheckbox } from '../components/common/HideCancelledCheckbox';

const { Title } = Typography;

export function ServiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServiceOrderId, setEditingServiceOrderId] = useState<number | undefined>();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hook para ocultar cancelamentos
  const { hideCancelled, setHideCancelled } = useHideCancelled('serviceOrders');

  const { data: serviceOrders, isLoading, error } = useServiceOrders({
    status: selectedStatus || undefined,
    customer_name: searchText || undefined,
  });

  // Log para debug
  if (error) {
    console.error('Erro ao carregar ordens de serviço:', error);
  }

  // Função para verificar se ordem está cancelada
  const isCancelledServiceOrder = (order: ServiceOrder) => {
    return order.status === 'cancelled';
  };

  // Filtrar ordens de serviço localmente (backup do filtro da API)
  const filteredServiceOrders = useMemo(() => {
    if (!serviceOrders) return [];

    return serviceOrders.filter(order => {
      const matchesSearch = searchText === '' ||
        order.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.vehicles?.plate?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.service_description?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.professional_name?.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = selectedStatus === '' || order.status === selectedStatus;

      const matchesCancelled = !hideCancelled || !isCancelledServiceOrder(order);

      return matchesSearch && matchesStatus && matchesCancelled;
    });
  }, [serviceOrders, searchText, selectedStatus, hideCancelled]);

  // Converter Decimal do Prisma para número
  const parseDecimal = (value: any): number => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'd' in value) {
      // Prisma Decimal format: {s: sign, e: exponent, d: digits}
      const sign = value.s || 1;
      const exponent = value.e || 0;
      const digits = value.d || [0];
      const numStr = digits.join('');
      const num = parseFloat(numStr) * Math.pow(10, exponent - digits.length + 1);
      return sign * num;
    }
    return 0;
  };

  const formatCurrency = (value?: any) => {
    const numValue = parseDecimal(value);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(numValue);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return dayjs.utc(date).format('DD/MM/YYYY');
  };

  const handleView = (id: number) => {
    navigate(`/servicos/${id}`);
  };

  const handleCreate = () => {
    setEditingServiceOrderId(undefined);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingServiceOrderId(undefined);
  };

  const calculateTotal = (order: ServiceOrder) => {
    let total = parseDecimal(order.estimated_labor_cost);
    
    // Somar produtos
    if (order.service_products) {
      total += order.service_products.reduce((sum, product) => {
        const qty = parseDecimal(product.product_qtd);
        const price = parseDecimal(product.products.sell_price);
        return sum + (qty * price);
      }, 0);
    }

    // Somar serviços realizados
    if (order.services_realized) {
      total += order.services_realized.reduce((sum, service) => {
        const qty = parseDecimal(service.service_qtd);
        const cost = parseDecimal(service.service.service_cost);
        return sum + (qty * cost);
      }, 0);
    }

    return total;
  };

  const columns: ColumnsType<ServiceOrder> = [
    {
      title: t('services.actions'),
      key: 'actions',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleView(record.service_order_id)}
          size="small"
        >
          {t('common.view')}
        </Button>
      ),
    },
    {
      title: t('services.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: t('services.vehicle'),
      key: 'vehicle',
      width: 200,
      render: (_, record) => {
        if (!record.vehicles) return '-';
        return (
          <div>
            <div>{record.vehicles.brand} {record.vehicles.model}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {record.vehicles.plate} - {record.vehicles.year}
            </div>
          </div>
        );
      },
    },
    {
      title: t('services.description'),
      dataIndex: 'service_description',
      key: 'service_description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('services.professional'),
      dataIndex: 'professional_name',
      key: 'professional_name',
      width: 130,
      render: (name: string) => name || '-',
    },
    {
      title: t('services.createdIn'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      align: 'center',
      render: (date: string) => formatDate(date),
    },
  ];

  const statusOptions: { value: ServiceOrderStatus | ''; label: string }[] = [
    { value: '', label: t('services.allStatuses') },
    { value: 'draft', label: t('services.status.draft') },
    { value: 'in_progress', label: t('services.status.in_progress') },
    { value: 'completed', label: t('services.status.completed') },
    { value: 'cancelled', label: t('services.status.cancelled') },
  ];

  const getStatusColor = (status: ServiceOrderStatus): string => {
    switch (status) {
      case 'draft': return 'default';
      case 'in_progress': return 'processing';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: ServiceOrderStatus): string => {
    switch (status) {
      case 'draft': return t('services.status.draft');
      case 'in_progress': return t('services.status.in_progress');
      case 'completed': return t('services.status.completed');
      case 'cancelled': return t('services.status.cancelled');
      default: return status;
    }
  };

  const renderMobileCards = () => {
    if (isLoading) {
      return (
        <Card loading style={{ marginBottom: 16 }}>
          <Card.Meta title="Loading..." description="Loading..." />
        </Card>
      );
    }

    if (!filteredServiceOrders || filteredServiceOrders.length === 0) {
      return (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            {t('services.noOrders')}
          </div>
        </Card>
      );
    }

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {filteredServiceOrders.map((order) => (
          <Card
            key={order.service_order_id}
            size="small"
            style={{ borderRadius: 8 }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {/* Header com Status e Botão */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Tag>
                <Button
                  type="primary"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleView(order.service_order_id)}
                >
                  {t('common.view')}
                </Button>
              </div>

              {/* Cliente */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 500 }}>{order.customer_name || '-'}</span>
              </div>

              {/* Veículo */}
              {order.vehicles && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CarOutlined style={{ color: '#52c41a', marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {order.vehicles.brand} {order.vehicles.model}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {order.vehicles.plate} - {order.vehicles.year}
                    </div>
                  </div>
                </div>
              )}

              {/* Descrição */}
              {order.service_description && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <ToolOutlined style={{ color: '#faad14', marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: '#666', flex: 1 }}>
                    {order.service_description}
                  </div>
                </div>
              )}

              {/* Profissional */}
              {order.professional_name && (
                <div style={{ fontSize: 12, color: '#888' }}>
                  <strong>{t('services.professional')}:</strong> {order.professional_name}
                </div>
              )}

              {/* Footer com Data e Valor */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 8,
                borderTop: '1px solid #f0f0f0',
                marginTop: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888' }}>
                  <CalendarOutlined />
                  {formatDate(order.created_at)}
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#1890ff' }}>
                  {formatCurrency(calculateTotal(order))}
                </div>
              </div>
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  return (
    <div>
      <PageHeader
        title={t('services.ordersList')}
        subtitle={t('services.subtitle')}
        helpText={t('services.serviceOrdersPageHelp')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size={isMobile ? 'middle' : 'large'}
          >
            {isMobile ? 'Novo' : t('services.newOrder')}
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={16} lg={12}>
            <Input
              placeholder={t('services.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder={t('services.filterByStatus')}
              value={selectedStatus || undefined}
              onChange={(value) => setSelectedStatus(value || '')}
              allowClear
              options={statusOptions}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <HideCancelledCheckbox
              checked={hideCancelled}
              onChange={setHideCancelled}
            />
          </Col>
        </Row>
      </Card>

      {error && (
        <Alert
          message={t('services.errorLoading')}
          description={t('services.errorLoadingDescription')}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {isMobile ? (
        renderMobileCards()
      ) : (
        <Card>
          <Table
            columns={columns}
            dataSource={filteredServiceOrders}
            loading={isLoading}
            rowKey="service_order_id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => t('services.totalOrders', { total }),
              responsive: true,
            }}
            size="small"
            scroll={{ x: 'max-content' }}
            sticky
          />
        </Card>
      )}

      <ServiceOrderModal
        open={modalOpen}
        serviceOrderId={editingServiceOrderId}
        onClose={handleCloseModal}
      />
    </div>
  );
}
