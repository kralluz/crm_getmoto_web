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
  message,
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
import { formatCurrency, formatDate, formatDateTime } from '../utils/format.util';
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

  const handleGenerateReport = async () => {
    if (!vehicle || !statsData) return;

    try {
      const { generateVehicleReport } = await import('../utils/reports/vehicle.report');
      
      // Preparar dados para o relatório
      const vehicleData = {
        vehicle_id: vehicle.vehicle_id,
        plate: vehicle.plate,
        brand: vehicle.brand || undefined,
        model: vehicle.model || undefined,
        year: vehicle.year || undefined,
        color: vehicle.color || undefined,
        mile: vehicle.mile || undefined,
        created_at: vehicle.created_at,
        service_order: vehicle.service_order || [],
      };

      const stats = {
        totalOrders: statsData.stats.totalOrders,
        completedOrders: statsData.stats.completedOrders,
        totalSpent: statsData.stats.totalSpent,
        averagePerOrder: statsData.stats.averagePerOrder,
        lastServiceDate: statsData.stats.lastService || undefined,
      };

      await generateVehicleReport(vehicleData, stats);
    } catch (error) {
      console.error('Error generating vehicle report:', error);
      message.error(t('vehicles.reportError'));
    }
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

  // Calcular total de uma ordem
  const calculateOrderTotal = (order: any) => {
    let subtotal = 0;

    // Produtos
    if (order.service_products) {
      subtotal += order.service_products.reduce((sum: number, product: any) => {
        const qty = parseFloat(product.product_qtd) || 0;
        const price = parseFloat(product.unit_price) || 0;
        return sum + (qty * price);
      }, 0);
    }

    // Serviços
    if (order.services_realized) {
      subtotal += order.services_realized.reduce((sum: number, service: any) => {
        const qty = parseFloat(service.service_qtd) || 0;
        const price = parseFloat(service.unit_price) || 0;
        return sum + (qty * price);
      }, 0);
    }

    let discount = 0;
    let discountPercent = 0;
    
    if (order.discount_amount) {
      discount = parseFloat(order.discount_amount) || 0;
    } else if (order.discount_percent) {
      discountPercent = parseFloat(order.discount_percent) || 0;
      discount = subtotal * (discountPercent / 100);
    }

    const total = subtotal - discount;

    return { subtotal, discount, discountPercent, total };
  };

  const serviceOrderColumns: ColumnsType<any> = [
    {
      title: t('common.actions'),
      key: 'actions',
      width: isMobile ? 80 : 100,
      align: 'center',
      fixed: isMobile ? 'left' : undefined,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => navigate(`/servicos/${record.service_order_id}`, {
            state: { fromVehicleDetail: true, vehicleId: id }
          })}
        >
          {isMobile ? '' : t('common.view')}
        </Button>
      ),
    },
    {
      title: t('services.creationDate'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: isMobile ? 100 : 130,
      render: (date: string) => dayjs.utc(date).format('DD/MM/YYYY'),
    },
    {
      title: t('timeEntries.employee'),
      dataIndex: 'employee',
      key: 'employee',
      width: isMobile ? 120 : 150,
      render: (employee: any) => employee?.name || '-',
    },
    {
      title: t('vehicles.mile'),
      dataIndex: 'vehicle_mile',
      key: 'vehicle_mile',
      width: isMobile ? 100 : 120,
      align: 'left',
      render: (mile: number | null) =>
        mile ? `${mile.toLocaleString('en-GB')} ${isMobile ? 'mi' : 'miles'}` : '-',
    },
    {
      title: t('common.total'),
      key: 'total',
      width: isMobile ? 150 : 180,
      align: 'left',
      render: (_, record) => {
        const { subtotal, discount, discountPercent, total } = calculateOrderTotal(record);
        
        if (discount > 0) {
          if (discountPercent > 0) {
            return (
              <span>
                {isMobile ? (
                  <>{formatCurrency(total)}</>
                ) : (
                  <>{formatCurrency(subtotal)} - {discountPercent.toFixed(2)}% = <strong>{formatCurrency(total)}</strong></>
                )}
              </span>
            );
          } else {
            return (
              <span>
                {isMobile ? (
                  <>{formatCurrency(total)}</>
                ) : (
                  <>{formatCurrency(subtotal)} - {formatCurrency(discount)} = <strong>{formatCurrency(total)}</strong></>
                )}
              </span>
            );
          }
        }
        
        return <strong>{formatCurrency(total)}</strong>;
      },
    },
    {
      title: t('table.description'),
      dataIndex: 'service_description',
      key: 'service_description',
      width: isMobile ? 150 : undefined,
      ellipsis: true,
      render: (desc: string | null) => desc || '-',
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

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
              <CarOutlined style={{ fontSize: isMobile ? 24 : 32, color: '#fa8c16' }} />
              <div>
                <Title level={isMobile ? 3 : 2} style={{ margin: 0, wordBreak: 'break-word' }}>
                  #{vehicle.vehicle_id} {vehicle.brand || t('vehicles.noBrand')}{' '}
                  {vehicle.model || t('vehicles.noModel')}
                </Title>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions 
            bordered 
            column={{ xs: 1, sm: 1, md: 2 }}
            labelStyle={{ 
              fontWeight: 'bold', 
              color: '#333',
              backgroundColor: '#fafafa'
            }}
            contentStyle={{ 
              color: '#333',
              fontWeight: '500',
              textAlign: 'left'
            }}
          >
            <Descriptions.Item label={t('vehicles.plate')}>
              <div
                style={{
                  display: 'inline-flex',
                  border: '3px solid #000',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  height: isMobile ? '28px' : '32px',
                  fontSize: isMobile ? '13px' : '15px',
                }}
              >
                {/* Faixa azul à esquerda */}
                <div
                  style={{
                    width: isMobile ? '10px' : '12px',
                    backgroundColor: '#0066cc',
                  }}
                />
                {/* Área branca com caracteres */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobile ? '0 6px' : '0 8px',
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: isMobile ? '13px' : '15px',
                    fontWeight: 'bold',
                    letterSpacing: isMobile ? '1px' : '2px',
                    color: '#000',
                    minWidth: isMobile ? '60px' : '75px',
                  }}
                >
                  {vehicle.plate}
                </div>
              </div>
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
            <Descriptions.Item label={isMobile ? <span>Mile<br/>Odometer</span> : t('vehicles.mile')}>
              {vehicle.mile ? `${vehicle.mile.toLocaleString('pt-BR')} miles` : '-'}
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
            {statsData && statsData.stats.lastService && (
              <Descriptions.Item label={t('vehicles.lastService')}>
                {dayjs(statsData.stats.lastService).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Space>
      </Card>

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

      {vehicle.service_order && vehicle.service_order.length > 0 && (
        <Card>
          <Title level={4}>{t('vehicles.serviceHistory')}</Title>
          <Table
            columns={serviceOrderColumns}
            dataSource={vehicle.service_order}
            rowKey="service_order_id"
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}
    </div>
  );
}
