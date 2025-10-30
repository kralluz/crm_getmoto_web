import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, Modal, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useServiceCategories, useDeleteServiceCategory } from '../hooks/useServiceCategories';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import type { ServiceCategory } from '../types/service-category';
import { useFormat } from '../hooks/useFormat';
import { parseDecimal } from '../utils';
import dayjs from 'dayjs';

const { Link } = Typography;

export function ServiceCategoryList() {
  const navigate = useNavigate();
  const { formatCurrency } = useFormat();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);

  const { data: categories, isLoading } = useServiceCategories({
    is_active: activeFilter,
  });
  const { mutate: deleteCategory } = useDeleteServiceCategory();

  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories.filter(category => {
      const matchesSearch = searchText === '' ||
        category.service_name.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    });
  }, [categories, searchText]);

  const handleEdit = (id: number) => {
    navigate(`/categorias-servicos/${id}/editar`);
  };

  const handleDelete = async (id: number) => {
    const category = categories?.find(c => c.service_id === id);

    Modal.confirm({
      title: 'Deletar Serviço',
      icon: <ExclamationCircleOutlined />,
      content: `Tem certeza que deseja deletar o serviço "${category?.service_name}"? Esta ação não pode ser desfeita se o serviço estiver vinculado a ordens de serviço.`,
      okText: 'Sim, deletar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: () => {
        deleteCategory(id);
      },
    });
  };

  const handleCreate = () => {
    navigate('/categorias-servicos/novo');
  };

  const columns: ColumnsType<ServiceCategory> = [
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <ActionButtons
          onView={() => navigate(`/categorias-servicos/${record.service_id}`)}
          onEdit={() => handleEdit(record.service_id)}
          onDelete={() => handleDelete(record.service_id)}
          showView
          showEdit
          showDelete
          deleteTitle="Deletar Serviço"
          deleteDescription={`Tem certeza que deseja deletar o serviço "${record.service_name}"?`}
          iconOnly
        />
      ),
    },
    {
      title: 'Nome do Serviço',
      dataIndex: 'service_name',
      key: 'service_name',
      ellipsis: true,
      sorter: (a, b) => a.service_name.localeCompare(b.service_name),
      render: (name: string, record) => (
        <Link onClick={() => navigate(`/categorias-servicos/${record.service_id}`)}>
          {name}
        </Link>
      ),
    },
    {
      title: 'Custo do Serviço',
      dataIndex: 'service_cost',
      key: 'service_cost',
      width: 150,
      align: 'right',
      render: (value: any) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(parseDecimal(value))}
        </span>
      ),
      sorter: (a, b) => parseDecimal(a.service_cost) - parseDecimal(b.service_cost),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
      filters: [
        { text: 'Ativo', value: true },
        { text: 'Inativo', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Criado em',
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
        title="Serviços"
        subtitle="Gerencie os serviços disponíveis"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Novo Serviço
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por nome..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            placeholder="Status"
            value={activeFilter}
            onChange={setActiveFilter}
            style={{ width: 150 }}
            options={[
              { value: undefined, label: 'Todos' },
              { value: true, label: 'Ativos' },
              { value: false, label: 'Inativos' },
            ]}
          />

          {(searchText || activeFilter !== true) && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('');
                setActiveFilter(true);
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredCategories}
          loading={isLoading}
          rowKey="service_id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} serviços`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          size="small"
        />
      </Card>
    </div>
  );
}
