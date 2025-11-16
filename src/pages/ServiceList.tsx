import { useState, useMemo } from 'react';
import { Table, Card, Input, Typography, Select, Button, Alert, Row, Col } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useServiceOrders } from '../hooks/useServices';
import { ServiceOrderModal } from '../components/services/ServiceOrderModal';
import { PageHeader } from '../components/common/PageHeader';
import type { ServiceOrder, ServiceOrderStatus } from '../types/service-order';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

export function ServiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServiceOrderId, setEditingServiceOrderId] = useState<number | undefined>();

  const { data: serviceOrders, isLoading, error } = useServiceOrders({
    status: selectedStatus || undefined,
    customer_name: searchText || undefined,
  });

  // Log para debug
  if (error) {
    console.error('Erro ao carregar ordens de serviço:', error);
  }

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

      return matchesSearch && matchesStatus;
    });
  }, [serviceOrders, searchText, selectedStatus]);

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
    {
      title: t('services.totalEstimated'),
      key: 'total_estimated',
      width: 130,
      align: 'right',
      render: (_, record) => formatCurrency(calculateTotal(record)),
    },
  ];

  const statusOptions: { value: ServiceOrderStatus | ''; label: string }[] = [
    { value: '', label: t('services.allStatuses') },
    { value: 'draft', label: t('services.status.draft') },
    { value: 'in_progress', label: t('services.status.in_progress') },
    { value: 'completed', label: t('services.status.completed') },
    { value: 'cancelled', label: t('services.status.cancelled') },
  ];

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
            size="large"
          >
            {t('services.newOrder')}
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
          scroll={{ x: 1300 }}
          sticky
        />
      </Card>

      <ServiceOrderModal
        open={modalOpen}
        serviceOrderId={editingServiceOrderId}
        onClose={handleCloseModal}
      />
    </div>
  );
}
