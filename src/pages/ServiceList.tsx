import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Typography, Select, Button, Alert, Row, Col } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useServiceOrders, useDeleteServiceOrder } from '../hooks/useServices';
import { ActionButtons } from '../components/common/ActionButtons';
import type { ServiceOrder, ServiceOrderStatus } from '../types/service-order';
import dayjs from 'dayjs';

const { Title } = Typography;

const STATUS_COLORS: Record<ServiceOrderStatus, string> = {
  draft: 'default',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  draft: 'Rascunho',
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export function ServiceList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | ''>('');

  const { data: serviceOrders, isLoading, error } = useServiceOrders({
    status: selectedStatus || undefined,
    customer_name: searchText || undefined,
  });
  const { mutate: deleteServiceOrder } = useDeleteServiceOrder();

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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY HH:mm');
  };

  const handleView = (id: number) => {
    navigate(`/servicos/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/servicos/${id}/editar`);
  };

  const handleDelete = async (id: number) => {
    deleteServiceOrder(id);
  };

  const handleCreate = () => {
    navigate('/servicos/novo');
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
      title: 'Ações',
      key: 'actions',
      width: 120,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <ActionButtons
          onView={() => handleView(record.service_order_id)}
          onEdit={() => handleEdit(record.service_order_id)}
          onDelete={() => handleDelete(record.service_order_id)}
          showView
          showEdit
          showDelete
          iconOnly
          deleteTitle="Deletar Ordem de Serviço"
          deleteDescription={`Tem certeza que deseja deletar a ordem de serviço #${record.service_order_id}?`}
        />
      ),
    },
    {
      title: '#',
      dataIndex: 'service_order_id',
      key: 'service_order_id',
      width: 80,
      render: (id: number) => `#${id}`,
    },
    {
      title: 'Cliente',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: 'Veículo',
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
      title: 'Descrição',
      dataIndex: 'service_description',
      key: 'service_description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: 'Profissional',
      dataIndex: 'professional_name',
      key: 'professional_name',
      width: 130,
      render: (name: string) => name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: ServiceOrderStatus) => (
        <Tag color={STATUS_COLORS[status]}>
          {STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      align: 'center',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Finalizado em',
      dataIndex: 'finalized_at',
      key: 'finalized_at',
      width: 130,
      align: 'center',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Custo Estimado',
      dataIndex: 'estimated_labor_cost',
      key: 'estimated_labor_cost',
      width: 120,
      align: 'right',
      render: (value: any) => formatCurrency(value),
    },
    {
      title: 'Total Estimado',
      key: 'total_estimated',
      width: 130,
      align: 'right',
      render: (_, record) => formatCurrency(calculateTotal(record)),
    },
  ];

  const statusOptions: { value: ServiceOrderStatus | ''; label: string }[] = [
    { value: '', label: 'Todos os Status' },
    { value: 'draft', label: 'Rascunho' },
    { value: 'in_progress', label: 'Em Progresso' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Title level={2} style={{ margin: 0 }}>Ordens de Serviço</Title>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
            block={window.innerWidth < 576}
          >
            Nova Ordem de Serviço
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={16} lg={12}>
            <Input
              placeholder="Buscar por cliente, placa, descrição..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filtrar por status"
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
          message="Erro ao carregar ordens de serviço"
          description="Não foi possível carregar as ordens de serviço. A API pode não estar disponível ou você pode não ter permissão."
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
            showTotal: (total) => `Total: ${total} ordens de serviço`,
            responsive: true,
          }}
          size="small"
          scroll={{ x: 1400 }}
          sticky
        />
      </Card>
    </div>
  );
}
