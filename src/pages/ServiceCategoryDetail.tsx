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
  Typography,
} from 'antd';
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';

const { Text } = Typography;
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
      title: 'ID',
      dataIndex: 'services_realized_id',
      key: 'services_realized_id',
      width: 80,
    },
    {
      title: t('services.serviceName'),
      key: 'service_name',
      render: () => category?.service_name || '-',
      width: 200,
    },
    {
      title: t('table.vehicle'),
      key: 'vehicle',
      render: (record: any) => {
        const motorcycle = record.service_order?.motorcycle;
        if (!motorcycle) return '-';
        return `${motorcycle.brand} ${motorcycle.model} (${motorcycle.license_plate})`;
      },
      width: 200,
    },
    {
      title: t('table.client'),
      key: 'client',
      render: (record: any) => {
        const client = record.service_order?.motorcycle?.client;
        return client?.client_name || record.service_order?.customer_name || '-';
      },
      width: 180,
    },
    {
      title: t('table.quantity'),
      dataIndex: 'service_qtd',
      key: 'service_qtd',
      width: 100,
      align: 'center',
    },
    {
      title: t('table.date'),
      key: 'date',
      render: (record: any) => {
        const date = record.service_order?.service_date || record.created_at;
        return FormatService.date(date, 'short');
      },
      width: 120,
    },
    {
      title: t('table.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/servicos/${record.service_order_id}`)}
        >
          {t('common.view')}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/categorias-servicos')}
          style={{ marginBottom: 16 }}
        >
          {t('common.back')}
        </Button>

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
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}

      {/* Lista de Veículos que tiveram este serviço */}
      {category.services_realized && category.services_realized.length > 0 && (() => {
        // Extrair veículos únicos
        const vehiclesMap = new Map();
        category.services_realized.forEach(service => {
          const motorcycle = service.service_order?.motorcycle;
          if (motorcycle && !vehiclesMap.has(motorcycle.motorcycle_id)) {
            vehiclesMap.set(motorcycle.motorcycle_id, {
              motorcycle_id: motorcycle.motorcycle_id,
              brand: motorcycle.brand,
              model: motorcycle.model,
              license_plate: motorcycle.license_plate,
              year: motorcycle.year,
              client: motorcycle.client,
              service_count: 1,
              last_service: service.service_order?.service_date || service.created_at,
            });
          } else if (motorcycle) {
            const existing = vehiclesMap.get(motorcycle.motorcycle_id);
            existing.service_count += 1;
            const currentDate = new Date(service.service_order?.service_date || service.created_at);
            const lastDate = new Date(existing.last_service);
            if (currentDate > lastDate) {
              existing.last_service = service.service_order?.service_date || service.created_at;
            }
          }
        });

        const vehiclesData = Array.from(vehiclesMap.values());

        const vehiclesColumns: ColumnsType<any> = [
          {
            title: t('table.vehicle'),
            key: 'vehicle',
            render: (record: any) => (
              <Space direction="vertical" size={0}>
                <Text strong>{`${record.brand} ${record.model}`}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>{record.license_plate}</Text>
              </Space>
            ),
          },
          {
            title: t('table.client'),
            key: 'client',
            render: (record: any) => record.client?.client_name || '-',
          },
          {
            title: t('vehicles.year'),
            dataIndex: 'year',
            key: 'year',
            width: 100,
          },
          {
            title: t('services.serviceCount'),
            dataIndex: 'service_count',
            key: 'service_count',
            width: 120,
            align: 'center',
            render: (count: number) => (
              <Tag color="blue">{count}x</Tag>
            ),
          },
          {
            title: t('services.lastService'),
            key: 'last_service',
            render: (record: any) => FormatService.date(record.last_service, 'short'),
            width: 130,
          },
          {
            title: t('table.actions'),
            key: 'actions',
            width: 100,
            align: 'center',
            render: (record: any) => (
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/veiculos/${record.motorcycle_id}`)}
              >
                {t('common.view')}
              </Button>
            ),
          },
        ];

        return (
          <Card title={t('services.vehiclesWithThisService')}>
            <Table
              columns={vehiclesColumns}
              dataSource={vehiclesData}
              rowKey="motorcycle_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        );
      })()}

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
