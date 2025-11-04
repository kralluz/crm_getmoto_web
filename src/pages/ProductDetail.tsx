import { useState } from 'react';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  Table, 
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  SwapOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProduct } from '../hooks/useProducts';
import { useFormat } from '../hooks/useFormat';
import { parseDecimal } from '../utils';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { PageHeader } from '../components/common/PageHeader';
import { StockMovementModal } from '../components/products/StockMovementModal';
import type { StockMove } from '../types/product';

const { Text } = Typography;

export function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatDateTime } = useFormat();
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  
  const productId = id ? parseInt(id) : undefined;
  const { data: product, isLoading } = useProduct(productId);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!product) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/produtos')}>
          Voltar
        </Button>
        <Card style={{ marginTop: 16 }}>
          <Alert message="Produto não encontrado" type="error" />
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/produtos');
  };

  const handleEdit = () => {
    navigate(`/produtos/${id}/editar`);
  };

  const quantity = parseDecimal(product.quantity);
  const quantityAlert = parseDecimal(product.quantity_alert);
  const buyPrice = parseDecimal(product.buy_price);
  const sellPrice = parseDecimal(product.sell_price);

  const isLowStock = quantity <= quantityAlert;
  const margin = buyPrice > 0 
    ? ((sellPrice - buyPrice) / buyPrice) * 100 
    : 0;

  const moveTypeLabels: Record<string, { label: string; color: string }> = {
    ENTRY: { label: t('inventory.entry'), color: 'green' },
    EXIT: { label: t('inventory.exit'), color: 'red' },
    ADJUSTMENT: { label: t('inventory.adjustment'), color: 'orange' },
  };

  const stockMoveColumns: ColumnsType<StockMove> = [
    {
      title: t('cashflow.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('cashflow.type'),
      dataIndex: 'move_type',
      key: 'move_type',
      width: 120,
      render: (type: string) => {
        const config = moveTypeLabels[type];
        return <Tag color={config?.color}>{config?.label || type}</Tag>;
      },
      filters: [
        { text: t('inventory.entry'), value: 'ENTRY' },
        { text: t('inventory.exit'), value: 'EXIT' },
        { text: t('inventory.adjustment'), value: 'ADJUSTMENT' },
      ],
      onFilter: (value, record) => record.move_type === value,
    },
    {
      title: t('inventory.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right',
      render: (qty: any, record) => {
        const qtyNum = parseDecimal(qty);
        const color = record.move_type === 'ENTRY' ? '#52c41a' :
                      record.move_type === 'EXIT' ? '#ff4d4f' : '#fa8c16';
        const prefix = record.move_type === 'ENTRY' ? '+' :
                       record.move_type === 'EXIT' ? '-' : '';
        return (
          <Text strong style={{ color }}>
            {prefix}{qtyNum.toFixed(1)}
          </Text>
        );
      },
    },
    {
      title: t('inventory.responsible'),
      dataIndex: ['users', 'name'],
      key: 'user',
      width: 180,
      render: (name: string) => name || '-',
    },
    {
      title: t('inventory.observations'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
        style={{ marginBottom: 16 }}
      >
        Voltar
      </Button>

      <PageHeader
        title={product.product_name}
        subtitle={product.product_category?.product_category_name}
        extra={
          <Space>
            <Button
              icon={<SwapOutlined />}
              onClick={() => setIsStockModalOpen(true)}
              size="large"
            >
              Movimentar Estoque
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="large"
            >
              Editar
            </Button>
          </Space>
        }
      />

      {isLowStock && (
        <Alert
          message="Estoque Baixo"
          description={`O estoque está abaixo do nível mínimo (${quantityAlert.toFixed(1)} unidades). Considere fazer uma reposição.`}
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Estoque Atual"
              value={quantity}
              precision={1}
              suffix="unidades"
              valueStyle={{ color: isLowStock ? '#ff4d4f' : '#1890ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Preço de Venda"
              value={sellPrice}
              precision={2}
              prefix="£"
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Preço de Compra"
              value={buyPrice}
              precision={2}
              prefix="£"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Margem de Lucro"
              value={margin}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: margin >= 30 ? '#52c41a' : margin >= 15 ? '#fa8c16' : '#ff4d4f',
                fontWeight: 600 
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
          <Descriptions.Item label="ID do Produto">
            {product.product_id}
          </Descriptions.Item>
          <Descriptions.Item label="Categoria">
            <Tag color="blue">{product.product_category?.product_category_name}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Estoque Mínimo">
            {quantityAlert.toFixed(1)} unidades
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={product.is_active ? 'green' : 'default'}>
              {product.is_active ? 'Ativo' : 'Inativo'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Data de Criação">
            {formatDateTime(product.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Última Atualização">
            {formatDateTime(product.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Histórico de Movimentações">
        <Table
          columns={stockMoveColumns}
          dataSource={product.stock_move || []}
          rowKey="stock_move_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} movimentações`,
          }}
          locale={{
            emptyText: 'Nenhuma movimentação registrada',
          }}
          size="small"
        />
      </Card>

      <StockMovementModal
        product={product}
        open={isStockModalOpen}
        onCancel={() => setIsStockModalOpen(false)}
        onSuccess={() => {
          // O hook já invalida as queries automaticamente
        }}
      />
    </div>
  );
}
