import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useVehicles, useDeleteVehicle } from '../hooks/useMotorcycles';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import type { Motorcycle } from '../types/motorcycle';
import dayjs from 'dayjs';

export function VehicleList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);

  const { data: vehicles, isLoading } = useVehicles({
    is_active: activeFilter,
  });
  const { mutate: deleteVehicle } = useDeleteVehicle();

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

  const handleDelete = async (id: number) => {
    deleteVehicle(id);
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
          onDelete={() => handleDelete(record.vehicle_id)}
          showView
          showEdit
          showDelete
          deleteTitle={t('vehicles.deleteVehicle')}
          deleteDescription={t('vehicles.deleteVehicleConfirm', {
            plate: record.plate,
          })}
          iconOnly
        />
      ),
    },
    {
      title: t('vehicles.id'),
      dataIndex: 'vehicle_id',
      key: 'vehicle_id',
      width: 80,
      sorter: (a, b) => a.vehicle_id - b.vehicle_id,
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
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('vehicles.title')}
        subtitle={t('vehicles.subtitle')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            {t('vehicles.newVehicle')}
          </Button>
        }
      />

      <Card>
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <Space wrap>
            <Input
              placeholder={t('vehicles.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />

            <Select
              placeholder={t('common.filter')}
              value={activeFilter}
              onChange={setActiveFilter}
              style={{ width: 150 }}
              suffixIcon={<FilterOutlined />}
              allowClear
            >
              <Select.Option value={true}>{t('vehicles.actives')}</Select.Option>
              <Select.Option value={false}>{t('vehicles.inactives')}</Select.Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredVehicles}
            rowKey="vehicle_id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) =>
                t('vehicles.totalVehicles', { total: total }),
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>
    </div>
  );
}
