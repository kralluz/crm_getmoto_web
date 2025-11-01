import { useState, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  DatePicker, 
  Space, 
  Select,
  Button,
  Tag
} from 'antd';
import { 
  StockOutlined, 
  WarningOutlined, 
  BarChartOutlined,
  DownloadOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useProducts, useStockMoves } from '../hooks/useProducts';
import { useFormat } from '../hooks/useFormat';
import { parseDecimal } from '../utils';
import { PageHeader } from '../components/common/PageHeader';
import { generateLowStockReport } from '../utils/reports';
import type { Product, StockMove } from '../types/product';

const { RangePicker } = DatePicker;

export function StockReport() {
  const { formatCurrency, formatDateTime } = useFormat();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [selectedProduct, setSelectedProduct] = useState<number | undefined>();

  const { data: products, isLoading: isLoadingProducts } = useProducts({ active: true });
  const { data: stockMoves, isLoading: isLoadingMoves } = useStockMoves({
    productId: selectedProduct,
    startDate: dateRange[0].toISOString(),
    endDate: dateRange[1].toISOString(),
  });

  // Cálculos de estatísticas
  const stats = useMemo(() => {
    if (!products) return null;

    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => parseDecimal(p.quantity) <= parseDecimal(p.quantity_alert)).length;
    const totalStockValue = products.reduce((sum, p) => sum + (parseDecimal(p.quantity) * parseDecimal(p.sell_price)), 0);
    const totalCostValue = products.reduce((sum, p) => sum + (parseDecimal(p.quantity) * parseDecimal(p.buy_price)), 0);

    return {
      totalProducts,
      lowStockProducts,
      totalStockValue,
      totalCostValue,
      profitPotential: totalStockValue - totalCostValue,
    };
  }, [products]);

  // Estatísticas de movimentações
  const moveStats = useMemo(() => {
    if (!stockMoves) return null;

    const entries = stockMoves.filter(m => m.move_type === 'ENTRY');
    const exits = stockMoves.filter(m => m.move_type === 'EXIT');
    const adjustments = stockMoves.filter(m => m.move_type === 'ADJUSTMENT');

    const totalEntries = entries.reduce((sum, m) => sum + parseDecimal(m.quantity), 0);
    const totalExits = exits.reduce((sum, m) => sum + parseDecimal(m.quantity), 0);

    return {
      totalMovements: stockMoves.length,
      entriesCount: entries.length,
      exitsCount: exits.length,
      adjustmentsCount: adjustments.length,
      totalEntries,
      totalExits,
    };
  }, [stockMoves]);

  const moveTypeLabels: Record<string, { label: string; color: string }> = {
    ENTRY: { label: 'Entrada', color: 'green' },
    EXIT: { label: 'Saída', color: 'red' },
    ADJUSTMENT: { label: 'Ajuste', color: 'orange' },
  };

  const handleGenerateLowStockPdf = () => {
    if (!products) return;

    setIsPdfLoading(true);
    try {
      const lowStockProducts = products.filter(p =>
        parseDecimal(p.quantity) <= parseDecimal(p.quantity_alert)
      );
      generateLowStockReport({ products: lowStockProducts });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const productColumns: ColumnsType<Product> = [
    {
      title: 'Produto',
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: (a, b) => a.product_name.localeCompare(b.product_name),
    },
    {
      title: 'Categoria',
      dataIndex: ['product_category', 'product_category_name'],
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Estoque',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      render: (qty: any, record) => {
        const qtyNum = parseDecimal(qty);
        const alertQty = parseDecimal(record.quantity_alert);
        const isLow = qtyNum <= alertQty;
        return (
          <span style={{ color: isLow ? '#ff4d4f' : undefined, fontWeight: isLow ? 600 : 400 }}>
            {isLow && <WarningOutlined style={{ marginRight: 4 }} />}
            {qtyNum.toFixed(1)}
          </span>
        );
      },
      sorter: (a, b) => parseDecimal(a.quantity) - parseDecimal(b.quantity),
    },
    {
      title: 'Valor Custo',
      key: 'cost_value',
      align: 'right',
      render: (_, record) => formatCurrency(parseDecimal(record.quantity) * parseDecimal(record.buy_price)),
      sorter: (a, b) => (parseDecimal(a.quantity) * parseDecimal(a.buy_price)) - (parseDecimal(b.quantity) * parseDecimal(b.buy_price)),
    },
    {
      title: 'Valor Venda',
      key: 'sell_value',
      align: 'right',
      render: (_, record) => formatCurrency(parseDecimal(record.quantity) * parseDecimal(record.sell_price)),
      sorter: (a, b) => (parseDecimal(a.quantity) * parseDecimal(a.sell_price)) - (parseDecimal(b.quantity) * parseDecimal(b.sell_price)),
    },
    {
      title: 'Lucro Potencial',
      key: 'potential_profit',
      align: 'right',
      render: (_, record) => {
        const profit = (parseDecimal(record.quantity) * parseDecimal(record.sell_price)) - (parseDecimal(record.quantity) * parseDecimal(record.buy_price));
        return (
          <span style={{ color: '#52c41a', fontWeight: 600 }}>
            {formatCurrency(profit)}
          </span>
        );
      },
      sorter: (a, b) => {
        const profitA = (parseDecimal(a.quantity) * parseDecimal(a.sell_price)) - (parseDecimal(a.quantity) * parseDecimal(a.buy_price));
        const profitB = (parseDecimal(b.quantity) * parseDecimal(b.sell_price)) - (parseDecimal(b.quantity) * parseDecimal(b.buy_price));
        return profitA - profitB;
      },
    },
  ];

  const movementColumns: ColumnsType<StockMove> = [
    {
      title: 'Data',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Produto',
      dataIndex: ['products', 'product_name'],
      key: 'product',
    },
    {
      title: 'Tipo',
      dataIndex: 'move_type',
      key: 'move_type',
      render: (type: string) => {
        const config = moveTypeLabels[type];
        return <Tag color={config?.color}>{config?.label || type}</Tag>;
      },
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (qty: any, record) => {
        const qtyNum = parseDecimal(qty);
        const color = record.move_type === 'ENTRY' ? '#52c41a' : 
                      record.move_type === 'EXIT' ? '#ff4d4f' : '#fa8c16';
        const prefix = record.move_type === 'ENTRY' ? '+' : 
                       record.move_type === 'EXIT' ? '-' : '';
        return (
          <span style={{ color, fontWeight: 600 }}>
            {prefix}{qtyNum.toFixed(1)}
          </span>
        );
      },
    },
    {
      title: 'Responsável',
      dataIndex: ['users', 'name'],
      key: 'user',
      render: (name: string) => name || '-',
    },
    {
      title: 'Observações',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Relatório de Estoque"
        subtitle="Análise completa do estoque e movimentações"
        extra={
          <Button
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleGenerateLowStockPdf}
            loading={isPdfLoading}
            disabled={!stats || stats.lowStockProducts === 0}
          >
            Alerta de Estoque Baixo (PDF)
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total de Produtos"
              value={stats?.totalProducts || 0}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Estoque Baixo"
              value={stats?.lowStockProducts || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Valor Total (Venda)"
              value={stats?.totalStockValue || 0}
              precision={2}
              prefix="R$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lucro Potencial"
              value={stats?.profitPotential || 0}
              precision={2}
              prefix="R$"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Inventário Completo" style={{ marginBottom: 16 }}>
        <Table
          columns={productColumns}
          dataSource={products || []}
          rowKey="product_id"
          loading={isLoadingProducts}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} produtos`,
          }}
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Card 
        title="Movimentações de Estoque"
        extra={
          <Space>
            <Select
              placeholder="Todos os produtos"
              style={{ width: 200 }}
              allowClear
              showSearch
              value={selectedProduct}
              onChange={setSelectedProduct}
              options={products?.map(p => ({
                value: p.product_id,
                label: p.product_name,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="DD/MM/YYYY"
              presets={[
                { label: 'Hoje', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                { label: 'Esta Semana', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                { label: 'Este Mês', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                { label: 'Últimos 30 dias', value: [dayjs().subtract(30, 'days'), dayjs()] },
              ]}
            />
          </Space>
        }
      >
        {moveStats && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic
                title="Total de Movimentações"
                value={moveStats.totalMovements}
                prefix={<BarChartOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Entradas"
                value={moveStats.totalEntries.toFixed(1)}
                valueStyle={{ color: '#52c41a' }}
                suffix={`(${moveStats.entriesCount})`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Saídas"
                value={moveStats.totalExits.toFixed(1)}
                valueStyle={{ color: '#ff4d4f' }}
                suffix={`(${moveStats.exitsCount})`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Ajustes"
                value={moveStats.adjustmentsCount}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
        )}

        <Table
          columns={movementColumns}
          dataSource={stockMoves || []}
          rowKey="stock_move_id"
          loading={isLoadingMoves}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} movimentações`,
          }}
          size="small"
          locale={{
            emptyText: 'Nenhuma movimentação no período selecionado',
          }}
        />
      </Card>
    </div>
  );
}
