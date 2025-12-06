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
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  CarOutlined,
  EditOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVehicle, useVehicleStats } from '../hooks/useMotorcycles';
import { formatCurrency } from '../utils/format.util';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [cameFromSearch, setCameFromSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(id ? parseInt(id) : undefined);
  const { data: statsData, isLoading: statsLoading } = useVehicleStats(id ? parseInt(id) : undefined);

  const isLoading = vehicleLoading || statsLoading;

  // Detectar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detectar se veio da página de busca
  useEffect(() => {
    const fromSearch = location.state?.fromSearch;
    setCameFromSearch(fromSearch);
  }, [location]);

  const handleBack = () => {
    if (cameFromSearch) {
      navigate(-1); // Volta para a página de busca
    } else {
      navigate('/veiculos'); // Volta para a lista de veículos
    }
  };

  const handleEdit = () => {
    navigate(`/veiculos/${id}/editar`);
  };

  const handleGenerateReport = () => {
    if (!vehicle) return;
    
    // Preparar dados para o relatório
    const reportData = {
      vehicle: {
        plate: vehicle.plate,
        brand: vehicle.brand || '-',
        model: vehicle.model || '-',
        year: vehicle.year || '-',
        mile: vehicle.mile || '-',
        color: vehicle.color || '-',
      },
      stats: statsData?.stats || {},
      serviceOrders: vehicle.service_order || [],
    };
    
    // Criar e baixar relatório em formato JSON (pode ser expandido para PDF)
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `veiculo-${vehicle.plate}-${dayjs().format('YYYY-MM-DD')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => navigate(`/servicos/${record.service_order_id}`)}
        >
          {t('common.view')}
        </Button>
      ),
    },
    {
      title: t('table.description'),
      dataIndex: 'service_description',
      key: 'service_description',
      ellipsis: true,
      render: (desc: string | null) => desc || '-',
    },
    {
      title: t('vehicles.mile'),
      dataIndex: 'vehicle_mile',
      key: 'vehicle_mile',
      width: 120,
      align: 'right',
      render: (mile: number | null) =>
        mile ? `${mile.toLocaleString('en-GB')} miles` : '-',
    },
    {
      title: t('services.creationDate'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date: string) => dayjs.utc(date).format('DD/MM/YYYY'),
    },
    {
      title: t('services.finalizationDate'),
      dataIndex: 'finalized_at',
      key: 'finalized_at',
      width: 130,
      render: (date: string | null) =>
        date ? dayjs.utc(date).format('DD/MM/YYYY') : '-',
    },
  ];

  return (
    <div>
      <div style={{
        marginBottom: 16,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 12 : 0,
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} size="middle">
          {t('common.back')}
        </Button>
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
          <Button icon={<FileTextOutlined />} onClick={handleGenerateReport} size="middle" block={isMobile}>
            {isMobile ? 'Relatório' : t('vehicles.generateReport')}
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit} size="middle" block={isMobile}>
            {t('common.edit')}
          </Button>
        </Space>
      </div>

      {/* Estatísticas */}
      {statsData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t('vehicles.totalOrders')}
                value={statsData.stats.totalOrders}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t('vehicles.completedOrders')}
                value={statsData.stats.completedOrders}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t('vehicles.totalSpent')}
                value={formatCurrency(statsData.stats.totalSpent)}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t('vehicles.averagePerOrder')}
                value={formatCurrency(statsData.stats.averagePerOrder)}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

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
            <Descriptions.Item label={t('vehicles.mile')}>
              {vehicle.mile ? `${vehicle.mile.toLocaleString('pt-BR')} km` : '-'}
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
            {statsData && (
              <>
                <Descriptions.Item label={t('vehicles.lastService')}>
                  {statsData.stats.lastService
                    ? dayjs(statsData.stats.lastService).format('DD/MM/YYYY HH:mm')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('vehicles.lastFinalized')}>
                  {statsData.stats.lastFinalized
                    ? dayjs(statsData.stats.lastFinalized).format('DD/MM/YYYY HH:mm')
                    : '-'}
                </Descriptions.Item>
              </>
            )}
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
