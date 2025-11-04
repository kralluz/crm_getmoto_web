import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Space,
  Button,
  Divider,
  Table,
  Spin,
  Empty,
} from 'antd';
import { ArrowLeftOutlined, CarOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVehicle } from '../hooks/useMotorcycles';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: vehicle, isLoading } = useVehicle(id ? parseInt(id) : undefined);

  const handleBack = () => {
    navigate('/veiculos');
  };

  const handleEdit = () => {
    navigate(`/veiculos/${id}/editar`);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <Card>
        <Empty description={t('vehicles.vehicleNotFound')} />
      </Card>
    );
  }

  const serviceOrderColumns: ColumnsType<any> = [
    {
      title: t('vehicles.id'),
      dataIndex: 'service_order_id',
      key: 'service_order_id',
      width: 80,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          draft: { color: 'default', text: t('services.status.draft') },
          pending: { color: 'orange', text: t('services.status.pending') },
          in_progress: {
            color: 'blue',
            text: t('services.status.in_progress'),
          },
          completed: { color: 'green', text: t('services.status.completed') },
          cancelled: { color: 'red', text: t('services.status.cancelled') },
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: t('table.description'),
      dataIndex: 'service_description',
      key: 'service_description',
      ellipsis: true,
      render: (desc: string | null) => desc || '-',
    },
    {
      title: t('services.creationDate'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('services.finalizationDate'),
      dataIndex: 'finalized_at',
      key: 'finalized_at',
      width: 130,
      render: (date: string | null) =>
        date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {t('common.back')}
        </Button>
        <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
          {t('common.edit')}
        </Button>
      </Space>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space>
              <CarOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {vehicle.brand || t('vehicles.noBrand')}{' '}
                  {vehicle.model || t('vehicles.noModel')}
                </Title>
                <Text type="secondary">
                  {t('vehicles.plate')}: {vehicle.plate}
                </Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label={t('vehicles.id')}>
              {vehicle.vehicle_id}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.plate')}>
              <Text strong>{vehicle.plate}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.brand')}>
              {vehicle.brand || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.model')}>
              {vehicle.model || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.year')}>
              {vehicle.year || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.color')}>
              {vehicle.color || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('common.status')}>
              <Tag color={vehicle.is_active ? 'green' : 'default'}>
                {vehicle.is_active ? t('common.active') : t('common.inactive')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.totalOrders')}>
              <Tag color="orange">
                {t('vehicles.serviceOrderCount', {
                  count: vehicle._count?.service_order || 0,
                })}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.createdAt')}>
              {dayjs(vehicle.created_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.updatedAt')}>
              {dayjs(vehicle.updated_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>

          {vehicle.service_order && vehicle.service_order.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>{t('vehicles.serviceHistory')}</Title>
                <Table
                  columns={serviceOrderColumns}
                  dataSource={vehicle.service_order}
                  rowKey="service_order_id"
                  pagination={false}
                  size="small"
                />
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
