import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Table,
  Statistic,
  Row,
  Col,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useServiceCategoryWithStats } from '../hooks/useServiceCategories';
import { FormatService } from '../services/format.service';
import type { ColumnsType } from 'antd/es/table';

export function ServiceCategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        <p>{t('services.serviceNotFound')}</p>
        <Button onClick={() => navigate('/categorias-servicos')}>
          {t('services.backToList')}
        </Button>
      </Card>
    );
  }

  const orderColumns: ColumnsType<any> = [
    {
      title: t('services.orderId'),
      dataIndex: 'service_order_id',
      key: 'service_order_id',
      width: 100,
    },
    {
      title: t('table.quantity'),
      dataIndex: 'service_qtd',
      key: 'service_qtd',
      width: 120,
      align: 'center',
    },
    {
      title: t('table.date'),
      dataIndex: 'service_order_date',
      key: 'service_order_date',
      render: (date: string) => FormatService.date(date, 'short'),
    },
  ];

  const realizedColumns: ColumnsType<any> = [
    {
      title: t('services.serviceId'),
      dataIndex: 'services_realized_id',
      key: 'services_realized_id',
      width: 100,
    },
    {
      title: t('table.quantity'),
      dataIndex: 'service_qtd',
      key: 'service_qtd',
      width: 120,
      align: 'center',
    },
    {
      title: t('table.date'),
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
            {t('common.back')}
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/categorias-servicos/${id}/editar`)}
          >
            {t('common.edit')}
          </Button>
        </Space>

        <Descriptions title={t('services.serviceInfo')} bordered>
          <Descriptions.Item label="ID">
            {category.service_id}
          </Descriptions.Item>
          <Descriptions.Item label={t('table.name')}>
            {category.service_name}
          </Descriptions.Item>
          <Descriptions.Item label={t('services.serviceCost')}>
            {FormatService.currency(category.service_cost)}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Tag color={category.is_active ? 'green' : 'red'}>
              {category.is_active ? t('common.active') : t('common.inactive')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('services.creationDate')}>
            {FormatService.date(category.created_at, 'short')}
          </Descriptions.Item>
          <Descriptions.Item label={t('services.lastUpdate')}>
            {FormatService.date(category.updated_at, 'short')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('services.stats')}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title={t('services.servicesRealized')}
              value={category.stats?.total_services_realized || 0}
              valueStyle={{ color: '#1890ff', fontWeight: 600 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title={t('services.estimatedRevenue')}
              value={category.stats?.estimated_revenue || 0}
              prefix="£"
              precision={2}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
          </Col>
        </Row>
      </Card>

      {category.service_order && category.service_order.length > 0 && (
        <Card title={t('services.recentServiceOrders')}>
          <Table
            columns={orderColumns}
            dataSource={category.service_order}
            rowKey="service_order_id"
            pagination={false}
          />
        </Card>
      )}

      {category.services_realized && category.services_realized.length > 0 && (
        <Card title={t('services.recentServicesRealized')}>
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
            {t('services.noOrdersOrServices')}
          </p>
        </Card>
      )}
    </Space>
  );
}
