import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Typography, Space, Select, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useServices } from '../hooks/useServices';
import { ActionButtons } from '../components/common/ActionButtons';
import type { Service, ServiceStatus } from '../types/service';
import dayjs from 'dayjs';

const { Title } = Typography;

const STATUS_COLORS: Record<ServiceStatus, string> = {
  PENDING: 'gold',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
  WAITING_PARTS: 'orange',
};

export function ServiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatus | ''>('');

  const { data: services, isLoading } = useServices();

  // Filtrar serviços
  const filteredServices = useMemo(() => {
    if (!services) return [];

    return services.filter(service => {
      const matchesSearch = searchText === '' ||
        service.customer?.name.toLowerCase().includes(searchText.toLowerCase()) ||
        service.motorcycle?.plate?.toLowerCase().includes(searchText.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = selectedStatus === '' || service.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [services, searchText, selectedStatus]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  const handleView = (id: string) => {
    navigate(`/servicos/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/servicos/${id}/editar`);
  };

  const handleDelete = async (id: string) => {
    // TODO: Implementar chamada à API
    console.log('Delete service:', id);
  };

  const handleCreate = () => {
    navigate('/servicos/novo');
  };

  const columns: ColumnsType<Service> = [
    {
      title: t('services.customer'),
      key: 'customer',
      width: 150,
      render: (_, record) => record.customer?.name || '-',
    },
    {
      title: t('services.motorcycle'),
      key: 'motorcycle',
      width: 200,
      render: (_, record) => {
        if (!record.motorcycle) return '-';
        return (
          <div>
            <div>{record.motorcycle.brand} {record.motorcycle.model}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {t('services.plate')}: {record.motorcycle.plate}
            </div>
          </div>
        );
      },
    },
    {
      title: t('table.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('services.mechanic'),
      key: 'mechanic',
      width: 130,
      render: (_, record) => record.user?.name || '-',
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (status: ServiceStatus) => (
        <Tag color={STATUS_COLORS[status]}>
          {t(`services.status.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('services.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
      align: 'center',
      render: (date: string) => formatDate(date),
    },
    {
      title: t('services.estimatedEndDate'),
      dataIndex: 'estimatedEndDate',
      key: 'estimatedEndDate',
      width: 130,
      align: 'center',
      render: (date: string | null) => date ? formatDate(date) : '-',
    },
    {
      title: t('services.laborCost'),
      dataIndex: 'laborCost',
      key: 'laborCost',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('services.totalCost'),
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <ActionButtons
          onView={() => handleView(record.id)}
          onEdit={() => handleEdit(record.id)}
          onDelete={() => handleDelete(record.id)}
          showView
          deleteTitle="Deletar Serviço"
          deleteDescription={`Tem certeza que deseja deletar este serviço?`}
        />
      ),
    },
  ];

  const statusOptions: { value: ServiceStatus | ''; label: string }[] = [
    { value: '', label: t('services.allStatuses') },
    { value: 'PENDING', label: t('services.status.PENDING') },
    { value: 'IN_PROGRESS', label: t('services.status.IN_PROGRESS') },
    { value: 'WAITING_PARTS', label: t('services.status.WAITING_PARTS') },
    { value: 'COMPLETED', label: t('services.status.COMPLETED') },
    { value: 'CANCELLED', label: t('services.status.CANCELLED') },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>{t('services.title')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Nova Ordem de Serviço
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder={t('services.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder={t('services.filterByStatus')}
            value={selectedStatus || undefined}
            onChange={(value) => setSelectedStatus(value || '')}
            style={{ width: 200 }}
            allowClear
            options={statusOptions}
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredServices}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} ${t('services.title').toLowerCase()}`,
          }}
          size="small"
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
