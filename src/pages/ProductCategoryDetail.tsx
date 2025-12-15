import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Tag, Table, Statistic, Row, Col, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useProductCategoryWithStats } from '../hooks/useProductCategories';
import { FormatService } from '../services/format.service';
import type { ColumnsType } from 'antd/es/table';

interface Product {
  product_id: number;
  product_name: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
}

export function ProductCategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: category, isLoading } = useProductCategoryWithStats(Number(id));

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!category) {
    return (
      <Card>
        <p>{t('products.categoryNotFound')}</p>
        <Button onClick={() => navigate('/categorias-produtos')}>
          {t('common.backToList')}
        </Button>
      </Card>
    );
  }

  const columns: ColumnsType<Product> = [
    {
      title: t('vehicles.id'),
      dataIndex: 'product_id',
      key: 'product_id',
      width: 80,
    },
    {
      title: t('products.product'),
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: t('table.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (quantity: number) => (
        <Tag color={quantity > 0 ? 'green' : 'red'}>
          {quantity}
        </Tag>
      ),
    },
    {
      title: t('products.purchasePrice'),
      dataIndex: 'buy_price',
      key: 'buy_price',
      width: 150,
      align: 'right',
      render: (price: number) => FormatService.currency(price),
    },
    {
      title: t('products.salesPriceColumn'),
      dataIndex: 'sell_price',
      key: 'sell_price',
      width: 150,
      align: 'right',
      render: (price: number) => FormatService.currency(price),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/categorias-produtos')}
          >
            {t('common.back')}
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/categorias-produtos/${id}/editar`)}
          >
            {t('common.edit')}
          </Button>
        </Space>

        <Descriptions title={t('products.categoryInfo')} bordered>
          <Descriptions.Item label={t('vehicles.id')}>
            {category.product_category_id}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.name')}>
            {category.product_category_name}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Tag color={category.is_active ? 'green' : 'red'}>
              {category.is_active ? t('products.activeStatus') : t('products.inactiveStatus')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('products.creationDate')}>
            {FormatService.date(category.created_at, 'short')}
          </Descriptions.Item>
          <Descriptions.Item label={t('products.lastUpdate')}>
            {FormatService.date(category.updated_at, 'short')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('products.stats')}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title={t('products.totalProductsInCategory')}
              value={category.stats?.total_products || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
        </Row>
      </Card>

      {category.stats?.recent_products && category.stats.recent_products.length > 0 && (
        <Card title={t('products.recentProducts')}>
          <Table
            columns={columns}
            dataSource={category.stats.recent_products}
            rowKey="product_id"
            pagination={false}
          />
        </Card>
      )}

      {(!category.stats?.recent_products || category.stats.recent_products.length === 0) && (
        <Card>
          <p style={{ textAlign: 'center', color: '#999' }}>
            {t('products.noProductsInCategory')}
          </p>
        </Card>
      )}
    </Space>
  );
}
