import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Tag, Table, Statistic, Row, Col, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
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
        <p>Categoria não encontrada</p>
        <Button onClick={() => navigate('/categorias-produtos')}>
          Voltar para lista
        </Button>
      </Card>
    );
  }

  const columns: ColumnsType<Product> = [
    {
      title: 'ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 80,
    },
    {
      title: 'Produto',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Quantidade',
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
      title: 'Preço Compra',
      dataIndex: 'buy_price',
      key: 'buy_price',
      width: 150,
      align: 'right',
      render: (price: number) => FormatService.currency(price),
    },
    {
      title: 'Preço Venda',
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
            Voltar
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/categorias-produtos/${id}/editar`)}
          >
            Editar
          </Button>
        </Space>

        <Descriptions title="Informações da Categoria" bordered>
          <Descriptions.Item label="ID">
            {category.product_category_id}
          </Descriptions.Item>
          <Descriptions.Item label="Nome">
            {category.product_category_name}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={category.is_active ? 'green' : 'red'}>
              {category.is_active ? 'Ativa' : 'Inativa'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Data de Criação">
            {FormatService.date(category.created_at, 'short')}
          </Descriptions.Item>
          <Descriptions.Item label="Última Atualização">
            {FormatService.date(category.updated_at, 'short')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Estatísticas">
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Total de Produtos"
              value={category.stats?.total_products || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
        </Row>
      </Card>

      {category.stats?.recent_products && category.stats.recent_products.length > 0 && (
        <Card title="Produtos Recentes">
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
            Nenhum produto cadastrado nesta categoria
          </p>
        </Card>
      )}
    </Space>
  );
}
