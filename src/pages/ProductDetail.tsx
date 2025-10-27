import { Card, Descriptions, Tag, Typography, Space, Button, Divider } from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export function ProductDetail() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate('/produtos');
  };

  // Mock data - substituir por chamada real à API
  const product = {
    id: productId,
    code: 'PROD-001',
    name: 'Óleo Motul 5W30',
    brand: 'Motul',
    category: 'Lubrificantes',
    description: 'Óleo sintético premium para motores de alta performance',
    costPrice: 65.00,
    salePrice: 89.90,
    stockQuantity: 15,
    minStock: 5,
    active: true,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isLowStock = product.stockQuantity <= product.minStock;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
        style={{ marginBottom: 16 }}
      >
        Voltar
      </Button>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space>
              <ShoppingCartOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {product.name}
                </Title>
                <Text type="secondary">{product.code}</Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label={t('table.brand')}>
              {product.brand}
            </Descriptions.Item>
            <Descriptions.Item label={t('table.category')}>
              <Tag>{product.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('products.costPrice')}>
              {formatCurrency(product.costPrice)}
            </Descriptions.Item>
            <Descriptions.Item label={t('products.salePrice')}>
              <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                {formatCurrency(product.salePrice)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('table.stock')}>
              <Space>
                <Text strong style={{ color: isLowStock ? '#ff4d4f' : undefined }}>
                  {product.stockQuantity} unidades
                </Text>
                {isLowStock && <Tag color="red">Estoque baixo</Tag>}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Estoque mínimo">
              {product.minStock} unidades
            </Descriptions.Item>
            <Descriptions.Item label={t('table.status')}>
              <Tag color={product.active ? 'green' : 'default'}>
                {product.active ? t('products.active') : t('products.inactive')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Descrição" span={2}>
              {product.description}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>
    </div>
  );
}
