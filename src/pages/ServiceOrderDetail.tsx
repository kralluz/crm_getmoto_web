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
  Empty
} from 'antd';
import { 
  ArrowLeftOutlined, 
  FileTextOutlined, 
  EditOutlined, 
  ToolOutlined,
  ShoppingOutlined,
  DollarOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceOrder } from '../hooks/useServices';
import type { ServiceProduct, ServiceRealized, CashFlow } from '../types/service-order';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  draft: 'default',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const STATUS_LABELS = {
  draft: 'Rascunho',
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export function ServiceOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serviceOrderId = id ? parseInt(id) : 0;

  const { data: serviceOrder, isLoading, error } = useServiceOrder(serviceOrderId);

  const handleBack = () => {
    navigate('/servicos');
  };

  const handleEdit = () => {
    navigate(`/servicos/${id}/editar`);
  };

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

  const formatCurrency = (value: any) => {
    const numValue = parseDecimal(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY HH:mm');
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
      title: 'Produto',
      dataIndex: ['products', 'product_name'],
      key: 'product_name',
    },
    {
      title: 'Quantidade',
      dataIndex: 'product_qtd',
      key: 'product_qtd',
      align: 'center',
      render: (qty: any) => parseDecimal(qty).toFixed(2),
    },
    {
      title: 'Preço Unitário',
      dataIndex: ['products', 'sell_price'],
      key: 'sell_price',
      align: 'right',
      render: (price: any) => formatCurrency(price),
    },
    {
      title: 'Total',
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
      title: 'Serviço',
      dataIndex: ['service', 'service_category_name'],
      key: 'service_name',
    },
    {
      title: 'Quantidade',
      dataIndex: 'service_qtd',
      key: 'service_qtd',
      align: 'center',
      render: (qty: any) => parseDecimal(qty),
    },
    {
      title: 'Preço Unitário',
      dataIndex: ['service', 'service_cost'],
      key: 'service_cost',
      align: 'right',
      render: (cost: any) => formatCurrency(cost),
    },
    {
      title: 'Total',
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
      title: 'Data',
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Tipo',
      dataIndex: 'direction',
      key: 'direction',
      align: 'center',
      render: (direction: 'in' | 'out') => (
        <Tag color={direction === 'in' ? 'green' : 'red'}>
          {direction === 'in' ? 'Entrada' : 'Saída'}
        </Tag>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: any, record) => (
        <Text style={{ color: record.direction === 'in' ? '#52c41a' : '#ff4d4f' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Observação',
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
          Voltar
        </Button>
        <Empty description="Ordem de serviço não encontrada" />
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
        >
          Voltar
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEdit}
        >
          Editar
        </Button>
      </Space>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space>
              <FileTextOutlined style={{ fontSize: 32, color: '#13c2c2' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  Ordem de Serviço #{serviceOrder.service_order_id}
                </Title>
                <Text type="secondary">
                  Criada em {formatDateTime(serviceOrder.created_at)}
                </Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label="Cliente">
              <Text strong>{serviceOrder.customer_name || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Profissional">
              <Text strong>{serviceOrder.professional_name || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Veículo">
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
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[serviceOrder.status]}>
                {STATUS_LABELS[serviceOrder.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Categoria de Serviço">
              {serviceOrder.service ? (
                <div>
                  <Text strong>{serviceOrder.service.service_category_name}</Text>
                  <br />
                  <Text type="secondary">
                    Custo: {formatCurrency(serviceOrder.service.service_cost)}
                  </Text>
                </div>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Data de Finalização">
              <Text strong>{formatDateTime(serviceOrder.finalized_at)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Descrição do Serviço" span={2}>
              {serviceOrder.service_description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Diagnóstico" span={2}>
              {serviceOrder.diagnosis || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Observações" span={2}>
              {serviceOrder.notes || '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* Resumo Financeiro */}
          <Card 
            title={<><DollarOutlined /> Resumo Financeiro</>}
            style={{ marginTop: 24 }}
          >
            <Row gutter={16}>
              <Col xs={12} md={6}>
                <Statistic
                  title="Produtos"
                  value={totals.products}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Serviços"
                  value={totals.services}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Mão de Obra"
                  value={totals.labor}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Total"
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
              title={<><ShoppingOutlined /> Produtos Utilizados</>}
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
              title={<><ToolOutlined /> Serviços Realizados</>}
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
              title={<><DollarOutlined /> Movimentações Financeiras</>}
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
    </div>
  );
}
