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
import { FloatingActionButton } from '../components/common/FloatingActionButton';
import type { Motorcycle } from '../types/motorcycle';
import { formatDate } from '../utils/format.util';

export function VehicleList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: vehicles, isLoading } = useVehicles();

  const filteredVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) return [];

    return vehicles.filter((vehicle) => {
      // Filtro de status ativo/inativo
      if (activeFilter !== undefined && vehicle.is_active !== activeFilter) {
        return false;
      }

      // Filtro de busca por texto
      if (searchText === '') return true;

      const search = searchText.toLowerCase();
      return (
        vehicle.plate.toLowerCase().includes(search) ||
        vehicle.brand?.toLowerCase().includes(search) ||
        vehicle.model?.toLowerCase().includes(search)
      );
    });
  }, [vehicles, searchText, activeFilter]);

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
      width: 140,
      render: (plate: string) => (
        <div
          style={{
            display: 'inline-flex',
            border: '3px solid #000',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            height: '32px',
          }}
        >
          {/* Faixa azul à esquerda */}
          <div
            style={{
              width: '12px',
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
              padding: '0 8px',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '15px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              color: '#000',
              minWidth: '75px',
            }}
          >
            {(() => {
              const formattedPlate = plate?.toUpperCase().replace(/\s/g, '');
              return formattedPlate?.length >= 7
                ? `${formattedPlate.slice(0, 4)} ${formattedPlate.slice(4, 7)}`
                : plate?.toUpperCase() || '';
            })()}
          </div>
        </div>
      ),
    },
    {
      title: t('vehicles.brand'),
      dataIndex: 'brand',
      key: 'brand',
      ellipsis: true,
      render: (brand: string | null) => brand || '-',
    },
    {
      title: t('vehicles.model'),
      dataIndex: 'model',
      key: 'model',
      ellipsis: true,
      render: (model: string | null) => model || '-',
    },
    {
      title: t('vehicles.year'),
      dataIndex: 'year',
      key: 'year',
      width: 90,
      align: 'left',
      render: (year: number | null) => year || '-',
    },
    {
      title: isMobile ? <span>Mile<br />Odometer</span> : t('vehicles.mile'),
      dataIndex: 'mile',
      key: 'mile',
      width: 120,
      align: 'left',
      render: (mile: number | null) => mile ? `${mile.toLocaleString('pt-BR')} miles` : '-',
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
      align: 'left',
      render: (_, record) => (
        <Tag color="orange">
          {t('vehicles.serviceOrderCount', {
            count: record._count?.service_order || 0,
          })}
        </Tag>
      ),
    },
    {
      title: t('vehicles.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      align: 'left',
      render: (date: string) => formatDate(date),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('vehicles.title')}
        subtitle={t('vehicles.subtitle')}
        helpText={t('vehicles.pageHelp')}
        extra={
          !isMobile && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="large"
            >
              {t('vehicles.newVehicle')}
            </Button>
          )
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
                      <div
                        style={{
                          display: 'inline-flex',
                          border: '3px solid #000',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          height: '32px',
                        }}
                      >
                        {/* Faixa azul à esquerda */}
                        <div
                          style={{
                            width: '12px',
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
                            padding: '0 8px',
                            fontFamily: '"Courier New", Courier, monospace',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            letterSpacing: '2px',
                            color: '#000',
                            minWidth: '75px',
                          }}
                        >
                          {(() => {
                            const formattedPlate = vehicle.plate?.toUpperCase().replace(/\s/g, '');
                            return formattedPlate?.length >= 7
                              ? `${formattedPlate.slice(0, 4)} ${formattedPlate.slice(4, 7)}`
                              : vehicle.plate?.toUpperCase() || '';
                          })()}
                        </div>
                      </div>
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
                        <div>
                          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                            Mile<br />Odometer: {vehicle.mile.toLocaleString('pt-BR')} miles
                          </span>
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
                      <Tag color="orange">
                        {t('vehicles.serviceOrderCount', { count: vehicle._count?.service_order || 0 })}
                      </Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#8c8c8c' }}>
                      {t('vehicles.createdAt')}: {formatDate(vehicle.created_at)}
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
                pageSize: pageSize,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                onShowSizeChange: (_, size) => setPageSize(size),
                showTotal: (total) =>
                  t('vehicles.totalVehicles', { total: total }),
              }}
              size="middle"
              scroll={{ x: 1200 }}
            />
          )}
        </Space>
      </Card>

      {/* Floating Action Button para mobile */}
      <FloatingActionButton
        icon={<PlusOutlined />}
        tooltip={t('vehicles.newVehicle')}
        onClick={handleCreate}
        mobileOnly
      />
    </div>
  );
}
