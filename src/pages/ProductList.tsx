import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, Tooltip } from 'antd';
import { SearchOutlined, WarningOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import type { Product } from '../types/product';
import { useFormat } from '../hooks/useFormat';
import { parseDecimal } from '../utils';
import { useTranslation } from 'react-i18next';

export function ProductList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useFormat();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [lowStockFilter, setLowStockFilter] = useState<'all' | 'low'>('all');

  const { data: products, isLoading} = useProducts({
    active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    lowStock: lowStockFilter === 'low' ? true : undefined
  });
  const { mutate: deleteProduct } = useDeleteProduct();

  // Extrair categorias únicas
  const categories = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const uniqueCategories = new Set(
      products
        .map(p => p.product_category?.product_category_name)
        .filter(Boolean)
    );
    return Array.from(uniqueCategories) as string[];
  }, [products]);

  // Filtrar produtos localmente (para busca por texto)
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products.filter(product => {
      const matchesSearch = searchText === '' ||
        product.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.product_category?.product_category_name.toLowerCase().includes(searchText.toLowerCase());

      return matchesSearch;
    });
  }, [products, searchText]);

  const handleView = (id: number) => {
    navigate(`/produtos/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/produtos/${id}/editar`);
  };

  const handleDelete = async (id: number) => {
    deleteProduct(id);
  };

  const handleCreate = () => {
    navigate('/produtos/novo');
  };

  const columns: ColumnsType<Product> = [
    {
      title: t('products.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <ActionButtons
          onView={() => handleView(record.product_id)}
          onEdit={() => handleEdit(record.product_id)}
          onDelete={() => handleDelete(record.product_id)}
          showView
          deleteTitle={t('products.deleteProduct')}
          deleteDescription={t('products.deleteProductConfirm', { name: record.product_name })}
          iconOnly
        />
      ),
    },
    {
      title: 'ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 80,
      sorter: (a, b) => a.product_id - b.product_id,
    },
    {
      title: t('products.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
      sorter: (a, b) => a.product_name.localeCompare(b.product_name),
    },
    {
      title: t('products.category'),
      dataIndex: ['product_category', 'product_category_name'],
      key: 'category',
      width: 150,
      render: (category: string) => category && <Tag color="blue">{category}</Tag>,
      filters: categories.map(cat => ({ text: cat, value: cat })),
      onFilter: (value, record) =>
        record.product_category?.product_category_name === value,
    },
    {
      title: t('products.purchasePrice'),
      dataIndex: 'buy_price',
      key: 'buy_price',
      width: 130,
      align: 'right',
      render: (value: any) => formatCurrency(parseDecimal(value)),
      sorter: (a, b) => parseDecimal(a.buy_price) - parseDecimal(b.buy_price),
    },
    {
      title: t('products.salesPriceColumn'),
      dataIndex: 'sell_price',
      key: 'sell_price',
      width: 130,
      align: 'right',
      render: (value: any) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(parseDecimal(value))}
        </span>
      ),
      sorter: (a, b) => parseDecimal(a.sell_price) - parseDecimal(b.sell_price),
    },
    {
      title: t('products.margin'),
      key: 'margin',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const buyPrice = parseDecimal(record.buy_price);
        const sellPrice = parseDecimal(record.sell_price);
        const margin = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;
        return (
          <Tag color={margin >= 30 ? 'green' : margin >= 15 ? 'orange' : 'red'}>
            {margin.toFixed(1)}%
          </Tag>
        );
      },
      sorter: (a, b) => {
        const buyPriceA = parseDecimal(a.buy_price);
        const sellPriceA = parseDecimal(a.sell_price);
        const buyPriceB = parseDecimal(b.buy_price);
        const sellPriceB = parseDecimal(b.sell_price);
        const marginA = buyPriceA > 0 ? ((sellPriceA - buyPriceA) / buyPriceA) * 100 : 0;
        const marginB = buyPriceB > 0 ? ((sellPriceB - buyPriceB) / buyPriceB) * 100 : 0;
        return marginA - marginB;
      },
    },
    {
      title: t('products.stockColumn'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (value: any, record) => {
        const qty = parseDecimal(value);
        const alertQty = parseDecimal(record.quantity_alert);
        const isLowStock = qty <= alertQty;
        return (
          <Tooltip title={isLowStock ? `${t('products.minStockLabel')}: ${alertQty.toFixed(1)}` : ''}>
            <span style={{ color: isLowStock ? '#ff4d4f' : undefined, fontWeight: isLowStock ? 600 : 400 }}>
              {isLowStock && <WarningOutlined style={{ marginRight: 4 }} />}
              {qty.toFixed(1)}
            </span>
          </Tooltip>
        );
      },
      sorter: (a, b) => parseDecimal(a.quantity) - parseDecimal(b.quantity),
    },
    {
      title: t('products.statusFilter'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? t('products.active') : t('products.inactive')}
        </Tag>
      ),
      filters: [
        { text: t('products.active'), value: true },
        { text: t('products.inactive'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.productListSubtitle')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            {t('products.newProduct')}
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder={t('products.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            placeholder={t('products.statusFilter')}
            value={activeFilter}
            onChange={setActiveFilter}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: t('products.all') },
              { value: 'active', label: t('products.actives') },
              { value: 'inactive', label: t('products.inactives') },
            ]}
          />

          <Select
            placeholder={t('products.stockFilter')}
            value={lowStockFilter}
            onChange={setLowStockFilter}
            style={{ width: 180 }}
            options={[
              { value: 'all', label: t('products.all') },
              { value: 'low', label: t('products.lowStockFilter') },
            ]}
          />

          {(searchText || activeFilter !== 'active' || lowStockFilter !== 'all') && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('');
                setActiveFilter('active');
                setLowStockFilter('all');
              }}
            >
              {t('products.clearFilters')}
            </Button>
          )}
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          loading={isLoading}
          rowKey="product_id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => t('products.totalProducts', { total }),
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          size="small"
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
