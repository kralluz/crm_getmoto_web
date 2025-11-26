import { useState, useMemo, useEffect } from 'react';
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
  Tag,
  Typography,
  Tooltip
} from 'antd';
import { 
  StockOutlined, 
  WarningOutlined, 
  BarChartOutlined,
  DownloadOutlined,
  TagOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useProducts, useStockMoves } from '../hooks/useProducts';
import { useFormat } from '../hooks/useFormat';
import { parseDecimal } from '../utils';
import { PageHeader } from '../components/common/PageHeader';
import { generateLowStockReport } from '../utils/reports';
import type { Product, StockMove } from '../types/product';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export function StockReport() {
  const { t } = useTranslation();
  const { formatCurrency, formatDateTime } = useFormat();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [selectedProduct, setSelectedProduct] = useState<number | undefined>();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // Contar produtos críticos (abaixo do mínimo) e em atenção (até 150% do mínimo)
    const lowStockProducts = products.filter(p => {
      const qty = parseDecimal(p.quantity);
      const minQty = parseDecimal(p.quantity_alert);
      return qty <= minQty * 1.5;
    }).length;
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
    ENTRY: { label: t('inventory.entry'), color: 'green' },
    EXIT: { label: t('inventory.exit'), color: 'red' },
    ADJUSTMENT: { label: t('inventory.adjustment'), color: 'orange' },
  };

  const handleGenerateLowStockPdf = async () => {
    if (!products) return;

    setIsPdfLoading(true);
    try {
      // Filtrar produtos com estoque até 150% do mínimo (ponto de atenção)
      const lowStockProducts = products.filter(p => {
        const qty = parseDecimal(p.quantity);
        const minQty = parseDecimal(p.quantity_alert);
        return qty <= minQty * 1.5; // Até 150% do mínimo
      });
      await generateLowStockReport({
        products: lowStockProducts,
        translations: {
          title: t('inventory.lowStockAlert'),
          subtitle: t('inventory.lowStockSubtitle', { count: lowStockProducts.length }),
          summary: t('inventory.summary'),
          totalProducts: t('inventory.totalLowStock'),
          estimatedValue: t('inventory.estimatedReplenishment'),
          productsSection: t('inventory.lowStockProducts'),
          productsInfo: t('inventory.urgentReplenishment'),
          noProducts: t('inventory.noLowStockProducts'),
          tableHeaders: {
            product: t('inventory.product'),
            category: t('inventory.category'),
            status: t('common.status'),
            current: t('inventory.current'),
            minimum: t('inventory.minimum'),
            toBuy: t('inventory.toBuy'),
            unitPrice: t('inventory.unitPrice'),
            total: t('common.total'),
          },
          statusLabels: {
            depleted: t('inventory.statusDepleted'),
            critical: t('inventory.statusCritical'),
            attention: t('inventory.statusAttention'),
          },
          legend: t('inventory.statusLegend'),
          legendItems: {
            depleted: t('inventory.legendDepleted'),
            critical: t('inventory.legendCritical'),
            attention: t('inventory.legendAttention'),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const productColumns: ColumnsType<Product> = [
    {
      title: t('inventory.productLabel'),
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: (a, b) => a.product_name.localeCompare(b.product_name),
    },
    {
      title: t('inventory.category'),
      dataIndex: ['product_category', 'product_category_name'],
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: t('inventory.stock'),
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
            {qtyNum}
          </span>
        );
      },
      sorter: (a, b) => parseDecimal(a.quantity) - parseDecimal(b.quantity),
    },
    {
      title: t('inventory.costValue'),
      key: 'cost_value',
      align: 'right',
      render: (_, record) => formatCurrency(parseDecimal(record.quantity) * parseDecimal(record.buy_price)),
      sorter: (a, b) => (parseDecimal(a.quantity) * parseDecimal(a.buy_price)) - (parseDecimal(b.quantity) * parseDecimal(b.buy_price)),
    },
    {
      title: t('inventory.saleValue'),
      key: 'sell_value',
      align: 'right',
      render: (_, record) => formatCurrency(parseDecimal(record.quantity) * parseDecimal(record.sell_price)),
      sorter: (a, b) => (parseDecimal(a.quantity) * parseDecimal(a.sell_price)) - (parseDecimal(b.quantity) * parseDecimal(b.sell_price)),
    },
    {
      title: t('inventory.potentialProfit'),
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
      title: t('cashflow.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('inventory.product'),
      dataIndex: ['products', 'product_name'],
      key: 'product',
    },
    {
      title: t('cashflow.type'),
      dataIndex: 'move_type',
      key: 'move_type',
      render: (type: string) => {
        const config = moveTypeLabels[type];
        return <Tag color={config?.color}>{config?.label || type}</Tag>;
      },
    },
    {
      title: t('inventory.quantity'),
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
          <Text strong style={{ color }}>
            {prefix}{qtyNum}
          </Text>
        );
      },
    },
    {
      title: t('inventory.responsible'),
      dataIndex: ['users', 'name'],
      key: 'user',
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
      <PageHeader
        title={t('inventory.stockReport')}
        subtitle={t('products.subtitle')}
        helpText={t('inventory.pageHelp')}
        extra={
          <Button
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleGenerateLowStockPdf}
            loading={isPdfLoading}
            disabled={!stats || stats.lowStockProducts === 0}
          >
            {t('inventory.lowStockAlert')}
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('inventory.totalProducts')}
              value={stats?.totalProducts || 0}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('inventory.lowStock')}
              value={stats?.lowStockProducts || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('inventory.totalSaleValue')}
              value={stats?.totalStockValue || 0}
              precision={2}
              prefix="£"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('inventory.potentialProfitLabel')}
              value={stats?.profitPotential || 0}
              precision={2}
              prefix="£"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('inventory.fullInventory')} style={{ marginBottom: 16 }}>
        {isMobile ? (
          <Row gutter={[16, 16]}>
            {(products || []).map((product) => {
              const qtyNum = parseDecimal(product.quantity);
              const alertQty = parseDecimal(product.quantity_alert);
              const isLow = qtyNum <= alertQty;
              const costValue = parseDecimal(product.quantity) * parseDecimal(product.buy_price);
              const sellValue = parseDecimal(product.quantity) * parseDecimal(product.sell_price);
              const profit = sellValue - costValue;

              return (
                <Col xs={24} key={product.product_id}>
                  <Card size="small">
                    <div style={{ marginBottom: 8 }}>
                      <strong>{product.product_name}</strong>
                    </div>
                    {product.product_category && (
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="blue">{product.product_category.product_category_name}</Tag>
                      </div>
                    )}
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('inventory.stock')}:</span>
                        <span style={{ color: isLow ? '#ff4d4f' : undefined, fontWeight: isLow ? 600 : 400 }}>
                          {isLow && <WarningOutlined style={{ marginRight: 4 }} />}
                          {qtyNum}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('inventory.costValue')}:</span>
                        <span>{formatCurrency(costValue)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('inventory.saleValue')}:</span>
                        <span>{formatCurrency(sellValue)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('inventory.potentialProfit')}:</span>
                        <span style={{ color: '#52c41a', fontWeight: 600 }}>{formatCurrency(profit)}</span>
                      </div>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Table
            columns={productColumns}
            dataSource={products || []}
            rowKey="product_id"
            loading={isLoadingProducts}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => t('inventory.totalProductsCount', { total }),
            }}
            size="middle"
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      <Card 
        title={t('inventory.stockMovements')}
        extra={
          <Space>
            <Select
              placeholder={t('inventory.allProducts')}
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
                { label: t('inventory.today'), value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                { label: t('inventory.thisWeek'), value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                { label: t('inventory.thisMonth'), value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              ]}
            />
          </Space>
        }
      >
        {moveStats && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Statistic
                title={t('inventory.totalMovements')}
                value={moveStats.totalMovements}
                prefix={<BarChartOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={t('inventory.entries')}
                value={moveStats.totalEntries.toFixed(1)}
                valueStyle={{ color: '#52c41a' }}
                suffix={`(${moveStats.entriesCount})`}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={t('inventory.exits')}
                value={moveStats.totalExits.toFixed(1)}
                valueStyle={{ color: '#ff4d4f' }}
                suffix={`(${moveStats.exitsCount})`}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={t('inventory.adjustments')}
                value={moveStats.adjustmentsCount}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
        )}

        {isMobile ? (
          <Row gutter={[16, 16]}>
            {(stockMoves || []).map((move) => {
              const qtyNum = parseDecimal(move.quantity);
              const config = moveTypeLabels[move.move_type];
              const color = move.move_type === 'ENTRY' ? '#52c41a' :
                            move.move_type === 'EXIT' ? '#ff4d4f' : '#fa8c16';
              const prefix = move.move_type === 'ENTRY' ? '+' :
                             move.move_type === 'EXIT' ? '-' : '';

              return (
                <Col xs={24} key={move.stock_move_id}>
                  <Card size="small">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{move.products?.product_name}</strong>
                        <Tag color={config?.color}>{config?.label || move.move_type}</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('inventory.quantity')}:</span>
                        <Text strong style={{ color }}>
                          {prefix}{qtyNum}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('inventory.responsible')}:</span>
                        <span>{move.users?.name || '-'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                        {formatDateTime(move.created_at)}
                      </div>
                      {move.notes && (
                        <div style={{ fontSize: 12, fontStyle: 'italic', color: '#595959', marginTop: 4 }}>
                          {move.notes}
                        </div>
                      )}
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Table
            columns={movementColumns}
            dataSource={stockMoves || []}
            rowKey="stock_move_id"
            loading={isLoadingMoves}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => t('inventory.totalMovementsCount', { total }),
            }}
            size="middle"
            locale={{
              emptyText: t('inventory.noMovementInPeriod'),
            }}
          />
        )}
      </Card>
    </div>
  );
}
