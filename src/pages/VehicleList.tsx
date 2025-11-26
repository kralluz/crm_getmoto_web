import { useState, useMemo, useEffect } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, Row, Col, Tooltip } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useVehicles } from '../hooks/useMotorcycles';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import type { Motorcycle } from '../types/motorcycle';
import dayjs from 'dayjs';

export function VehicleList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: vehicles, isLoading } = useVehicles({
    is_active: activeFilter,
  });

  const filteredVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) return [];

    return vehicles.filter((vehicle) => {
      if (searchText === '') return true;

      const search = searchText.toLowerCase();
      return (
        vehicle.plate.toLowerCase().includes(search) ||
        vehicle.brand?.toLowerCase().includes(search) ||
        vehicle.model?.toLowerCase().includes(search)
      );
    });
  }, [vehicles, searchText]);

  const handleEdit = (id: number) => {
    navigate(`/veiculos/${id}/editar`);
  };

  const handleView = (id: number) => {
    navigate(`/veiculos/${id}`);
  };

  const handleCreate = () => {
    navigate('/veiculos/novo');
  };

  const columns: ColumnsType<Motorcycle> = [
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <ActionButtons
          onView={() => handleView(record.vehicle_id)}
          onEdit={() => handleEdit(record.vehicle_id)}
          showView
          showEdit
          iconOnly
        />
      ),
    },
    {
      title: t('vehicles.plate'),
      dataIndex: 'plate',
      key: 'plate',
      width: 130,
      render: (plate: string) => (
        <Tag color="blue" style={{ fontSize: '13px', fontWeight: 600 }}>
          {plate}
        </Tag>
      ),
      sorter: (a, b) => a.plate.localeCompare(b.plate),
    },
    {
      title: t('vehicles.brand'),
      dataIndex: 'brand',
      key: 'brand',
      ellipsis: true,
      render: (brand: string | null) => brand || '-',
      sorter: (a, b) => (a.brand || '').localeCompare(b.brand || ''),
    },
    {
      title: t('vehicles.model'),
      dataIndex: 'model',
      key: 'model',
      ellipsis: true,
      render: (model: string | null) => model || '-',
      sorter: (a, b) => (a.model || '').localeCompare(b.model || ''),
    },
    {
      title: t('vehicles.year'),
      dataIndex: 'year',
      key: 'year',
      width: 90,
      align: 'center',
      render: (year: number | null) => year || '-',
      sorter: (a, b) => (a.year || 0) - (b.year || 0),
    },
    {
      title: t('vehicles.mile'),
      dataIndex: 'mile',
      key: 'mile',
      width: 120,
      align: 'right',
      render: (mile: number | null) => mile ? `${mile.toLocaleString('pt-BR')} km` : '-',
      sorter: (a, b) => (a.mile || 0) - (b.mile || 0),
    },
    {
      title: t('vehicles.color'),
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string | null) => color || '-',
    },
    {
      title: t('vehicles.serviceOrders'),
      key: 'service_orders_count',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Tag color="orange">
          {t('vehicles.serviceOrderCount', {
            count: record._count?.service_order || 0,
          })}
        </Tag>
      ),
      sorter: (a, b) =>
        (a._count?.service_order || 0) - (b._count?.service_order || 0),
    },
    {
      title: t('common.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
      filters: [
        { text: t('common.active'), value: true },
        { text: t('common.inactive'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: t('vehicles.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      align: 'center',
      render: (date: string) => dayjs.utc(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('vehicles.title')}
        subtitle={t('vehicles.subtitle')}
        helpText={t('vehicles.pageHelp')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size={isMobile ? 'middle' : 'large'}
          >
            {isMobile ? 'Novo' : t('vehicles.newVehicle')}
          </Button>
        }
      />

      <Card>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={16} md={12}>
              <Input
                placeholder={t('vehicles.searchPlaceholder')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
                allowClear
              />
            </Col>

            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder={t('common.filter')}
                value={activeFilter}
                onChange={setActiveFilter}
                style={{ width: '100%' }}
                suffixIcon={<FilterOutlined />}
                allowClear
              >
                <Select.Option value={true}>{t('vehicles.actives')}</Select.Option>
                <Select.Option value={false}>{t('vehicles.inactives')}</Select.Option>
              </Select>
            </Col>
          </Row>

          {isMobile ? (
            <Row gutter={[16, 16]}>
              {filteredVehicles.map((vehicle) => (
                <Col xs={24} key={vehicle.vehicle_id}>
                  <Card
                    size="small"
                    actions={[
                      <Tooltip title={t('common.view')} key="view">
                        <EyeOutlined onClick={() => handleView(vehicle.vehicle_id)} />
                      </Tooltip>,
                      <Tooltip title={t('common.edit')} key="edit">
                        <EditOutlined onClick={() => handleEdit(vehicle.vehicle_id)} />
                      </Tooltip>,
                    ]}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="blue" style={{ fontSize: '14px', fontWeight: 600 }}>
                        {vehicle.plate}
                      </Tag>
                    </div>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('vehicles.brand')}:</span>
                        <span>{vehicle.brand || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('vehicles.model')}:</span>
                        <span>{vehicle.model || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('vehicles.year')}:</span>
                        <span>{vehicle.year || '-'}</span>
                      </div>
                      {vehicle.mile && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('vehicles.mile')}:</span>
                          <span>{vehicle.mile.toLocaleString('pt-BR')} km</span>
                        </div>
                      )}
                      {vehicle.color && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{t('vehicles.color')}:</span>
                          <span>{vehicle.color}</span>
                        </div>
                      )}
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      <Space wrap>
                        <Tag color="orange">
                          {t('vehicles.serviceOrderCount', { count: vehicle._count?.service_order || 0 })}
                        </Tag>
                        <Tag color={vehicle.is_active ? 'green' : 'default'}>
                          {vehicle.is_active ? t('common.active') : t('common.inactive')}
                        </Tag>
                      </Space>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#8c8c8c' }}>
                      {t('vehicles.createdAt')}: {dayjs.utc(vehicle.created_at).format('DD/MM/YYYY')}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredVehicles}
              rowKey="vehicle_id"
              loading={isLoading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) =>
                  t('vehicles.totalVehicles', { total: total }),
              }}
              size="middle"
              scroll={{ x: 1200 }}
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
