import { useState, useMemo, useEffect } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, Tooltip, Alert, Row, Col } from 'antd';
import { SearchOutlined, WarningOutlined, PlusOutlined, FilterOutlined, SwapOutlined, InfoCircleOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import { ProductModal } from '../components/products/ProductModal';
import { StockMovementModal } from '../components/products/StockMovementModal';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [stockMovementModalOpen, setStockMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | undefined>();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setEditingProductId(id);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    deleteProduct(id);
  };

  const handleCreate = () => {
    setEditingProductId(undefined);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProductId(undefined);
  };

  const handleOpenStockMovement = () => {
    // Abre modal com lista de produtos para selecionar
    // Ou podemos abrir um modal intermediário de seleção
    if (filteredProducts && filteredProducts.length > 0) {
      setSelectedProduct(filteredProducts[0]);
      setStockMovementModalOpen(true);
    }
  };

  const handleStockMovementSuccess = () => {
    setStockMovementModalOpen(false);
    setSelectedProduct(null);
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
      title: t('products.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: t('products.category'),
      dataIndex: ['product_category', 'product_category_name'],
      key: 'category',
      width: 150,
      render: (category: string) => category && <Tag color="blue">{category}</Tag>,
    },
    {
      title: t('products.purchasePrice'),
      dataIndex: 'buy_price',
      key: 'buy_price',
      width: 130,
      align: 'right',
      render: (value: any) => formatCurrency(parseDecimal(value)),
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
    },
    {
      title: t('products.stockColumn'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 150,
      align: 'center',
      render: (value: any, record) => {
        const qty = parseDecimal(value);
        const alertQty = parseDecimal(record.quantity_alert);
        const isLowStock = qty <= alertQty;
        return (
          <Space>
            <Tooltip title={isLowStock ? `${t('products.minStockLabel')}: ${alertQty}` : ''}>
              <span style={{ color: isLowStock ? '#ff4d4f' : undefined, fontWeight: isLowStock ? 600 : 400 }}>
                {isLowStock && <WarningOutlined style={{ marginRight: 4 }} />}
                {qty}
              </span>
            </Tooltip>
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => {
                setSelectedProduct(record);
                setStockMovementModalOpen(true);
              }}
              title={t('inventory.stockMovement') || 'Movimentar'}
            />
          </Space>
        );
      },
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
        helpText={t('products.pageHelp')}
        extra={
          <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
            <Button
              type="default"
              icon={<SwapOutlined />}
              onClick={handleOpenStockMovement}
              size={isMobile ? 'middle' : 'large'}
              disabled={!filteredProducts || filteredProducts.length === 0}
              block={isMobile}
            >
              {isMobile ? 'Movimentar' : t('stockAdjustment.title')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size={isMobile ? 'middle' : 'large'}
              block={isMobile}
            >
              {isMobile ? 'Novo' : t('products.newProduct')}
            </Button>
          </Space>
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

      <Alert
        message={
          <Space>
            <InfoCircleOutlined />
            {t('products.stockManagementInfo')}
          </Space>
        }
        description={t('products.stockManagementDescription')}
        type="info"
        showIcon={false}
        style={{ marginBottom: 16 }}
      />

      <Card>
        {isMobile ? (
          <Row gutter={[16, 16]}>
            {filteredProducts.map((product) => {
              const buyPrice = parseDecimal(product.buy_price);
              const sellPrice = parseDecimal(product.sell_price);
              const margin = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;
              const qty = parseDecimal(product.quantity);
              const alertQty = parseDecimal(product.quantity_alert);
              const isLowStock = qty <= alertQty;

              return (
                <Col xs={24} key={product.product_id}>
                  <Card
                    size="small"
                    actions={[
                      <Tooltip title={t('products.view')} key="view">
                        <EyeOutlined onClick={() => handleView(product.product_id)} />
                      </Tooltip>,
                      <Tooltip title={t('products.edit')} key="edit">
                        <EditOutlined onClick={() => handleEdit(product.product_id)} />
                      </Tooltip>,
                      <Tooltip title={t('inventory.stockMovement')} key="stock">
                        <SwapOutlined
                          onClick={() => {
                            setSelectedProduct(product);
                            setStockMovementModalOpen(true);
                          }}
                        />
                      </Tooltip>,
                      <Tooltip title={t('products.delete')} key="delete">
                        <DeleteOutlined
                          style={{ color: '#ff4d4f' }}
                          onClick={() => handleDelete(product.product_id)}
                        />
                      </Tooltip>,
                    ]}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <strong>{product.product_name}</strong>
                    </div>
                    {product.product_category && (
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="blue">{product.product_category.product_category_name}</Tag>
                      </div>
                    )}
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('products.purchasePrice')}:</span>
                        <span>{formatCurrency(buyPrice)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('products.salesPriceColumn')}:</span>
                        <span style={{ fontWeight: 600, color: '#52c41a' }}>{formatCurrency(sellPrice)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('products.margin')}:</span>
                        <Tag color={margin >= 30 ? 'green' : margin >= 15 ? 'orange' : 'red'}>
                          {margin.toFixed(1)}%
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('products.stockColumn')}:</span>
                        <span style={{ color: isLowStock ? '#ff4d4f' : undefined, fontWeight: isLowStock ? 600 : 400 }}>
                          {isLowStock && <WarningOutlined style={{ marginRight: 4 }} />}
                          {qty}
                        </span>
                      </div>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      <Tag color={product.is_active ? 'green' : 'default'}>
                        {product.is_active ? t('products.active') : t('products.inactive')}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
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
            size="middle"
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      <ProductModal
        open={modalOpen}
        productId={editingProductId}
        onClose={handleCloseModal}
      />

      {selectedProduct && (
        <StockMovementModal
          product={selectedProduct}
          open={stockMovementModalOpen}
          onCancel={() => {
            setStockMovementModalOpen(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleStockMovementSuccess}
        />
      )}
    </div>
  );
}
