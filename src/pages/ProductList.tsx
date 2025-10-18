import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Typography, Space, Select } from 'antd';
import { SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types/product';

const { Title } = Typography;

export function ProductList() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: products, isLoading } = useProducts();

  // Extrair categorias únicas
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(uniqueCategories) as string[];
  }, [products]);

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      const matchesSearch = searchText === '' ||
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchText.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchText.toLowerCase());

      const matchesCategory = selectedCategory === '' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchText, selectedCategory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns: ColumnsType<Product> = [
    {
      title: t('products.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('table.brand'),
      dataIndex: 'brand',
      key: 'brand',
      width: 150,
    },
    {
      title: t('table.category'),
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => category && <Tag>{category}</Tag>,
    },
    {
      title: t('products.costPrice'),
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('products.salePrice'),
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('table.stock'),
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      align: 'center',
      render: (value: number, record) => {
        const isLowStock = value <= record.minStock;
        return (
          <span style={{ color: isLowStock ? '#ff4d4f' : undefined }}>
            {isLowStock && <WarningOutlined style={{ marginRight: 4 }} />}
            {value}
          </span>
        );
      },
    },
    {
      title: t('table.status'),
      dataIndex: 'active',
      key: 'active',
      width: 100,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? t('products.active') : t('products.inactive')}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>{t('products.title')}</Title>

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
            placeholder={t('products.filterByCategory')}
            value={selectedCategory || undefined}
            onChange={(value) => setSelectedCategory(value || '')}
            style={{ width: 200 }}
            allowClear
            options={[
              { value: '', label: t('products.allCategories') },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} ${t('products.title').toLowerCase()}`,
          }}
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
