import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Tag, Table, Statistic, Row, Col, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useServiceCategoryWithStats } from '../hooks/useServiceCategories';
import { FormatService } from '../services/format.service';
import type { ColumnsType } from 'antd/es/table';

export function ServiceCategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: category, isLoading } = useServiceCategoryWithStats(Number(id));

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
        <Button onClick={() => navigate('/categorias-servicos')}>
          Voltar para lista
        </Button>
      </Card>
    );
  }

  const orderColumns: ColumnsType<any> = [
    {
      title: 'ID Ordem',
      dataIndex: 'service_order_id',
      key: 'service_order_id',
      width: 100,
    },
    {
      title: 'Quantidade',
      dataIndex: 'service_qtd',
      key: 'service_qtd',
      width: 120,
      align: 'center',
    },
    {
      title: 'Data',
      dataIndex: 'service_order_date',
      key: 'service_order_date',
      render: (date: string) => FormatService.date(date, 'short'),
    },
  ];

  const realizedColumns: ColumnsType<any> = [
    {
      title: 'ID Serviço',
      dataIndex: 'services_realized_id',
      key: 'services_realized_id',
      width: 100,
    },
    {
      title: 'Quantidade',
      dataIndex: 'service_qtd',
      key: 'service_qtd',
      width: 120,
      align: 'center',
    },
    {
      title: 'Data',
      dataIndex: 'service_os_date',
      key: 'service_os_date',
      render: (date: string) => FormatService.date(date, 'short'),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/categorias-servicos')}
          >
            Voltar
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/categorias-servicos/${id}/editar`)}
          >
            Editar
          </Button>
        </Space>

        <Descriptions title="Informações da Categoria" bordered>
          <Descriptions.Item label="ID">
            {category.service_category_id}
          </Descriptions.Item>
          <Descriptions.Item label="Nome">
            {category.service_category_name}
          </Descriptions.Item>
          <Descriptions.Item label="Custo do Serviço">
            {FormatService.currency(category.service_cost)}
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
              title="Total de Ordens"
              value={category.stats?.total_orders || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Serviços Realizados"
              value={category.stats?.total_services_realized || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Receita Estimada"
              value={category.stats?.estimated_revenue || 0}
              prefix="R$"
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>
      </Card>

      {category.service_order && category.service_order.length > 0 && (
        <Card title="Ordens de Serviço Recentes">
          <Table
            columns={orderColumns}
            dataSource={category.service_order}
            rowKey="service_order_id"
            pagination={false}
          />
        </Card>
      )}

      {category.services_realized && category.services_realized.length > 0 && (
        <Card title="Serviços Realizados Recentes">
          <Table
            columns={realizedColumns}
            dataSource={category.services_realized}
            rowKey="services_realized_id"
            pagination={false}
          />
        </Card>
      )}

      {(!category.service_order || category.service_order.length === 0) &&
       (!category.services_realized || category.services_realized.length === 0) && (
        <Card>
          <p style={{ textAlign: 'center', color: '#999' }}>
            Nenhum serviço registrado nesta categoria
          </p>
        </Card>
      )}
    </Space>
  );
}
