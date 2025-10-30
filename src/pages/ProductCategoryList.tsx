import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, Modal, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useProductCategories, useDeleteProductCategory } from '../hooks/useProductCategories';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import type { ProductCategory } from '../types/product-category';
import dayjs from 'dayjs';

const { Link } = Typography;

export function ProductCategoryList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const { data: categories, isLoading } = useProductCategories({
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
  });
  const { mutate: deleteCategory } = useDeleteProductCategory();

  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories.filter(category => {
      const matchesSearch = searchText === '' ||
        category.product_category_name.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    });
  }, [categories, searchText]);

  const handleEdit = (id: number) => {
    navigate(`/categorias-produtos/${id}/editar`);
  };

  const handleDelete = async (id: number) => {
    const category = categories?.find(c => c.product_category_id === id);
    const productCount = category?._count?.products || 0;

    if (productCount > 0) {
      Modal.warning({
        title: 'Não é possível deletar esta categoria',
        icon: <ExclamationCircleOutlined />,
        content: `Esta categoria possui ${productCount} produto(s) vinculado(s). Para deletar a categoria, primeiro remova ou reatribua os produtos.`,
        okText: 'Entendido',
      });
      return;
    }

    deleteCategory(id);
  };

  const handleCreate = () => {
    navigate('/categorias-produtos/novo');
  };

  const columns: ColumnsType<ProductCategory> = [
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <ActionButtons
          onView={() => navigate(`/categorias-produtos/${record.product_category_id}`)}
          onEdit={() => handleEdit(record.product_category_id)}
          onDelete={() => handleDelete(record.product_category_id)}
          showView
          showEdit
          showDelete
          deleteTitle="Deletar Categoria"
          deleteDescription={`Tem certeza que deseja deletar a categoria "${record.product_category_name}"?`}
          iconOnly
        />
      ),
    },
    {
      title: 'ID',
      dataIndex: 'product_category_id',
      key: 'product_category_id',
      width: 80,
      sorter: (a, b) => a.product_category_id - b.product_category_id,
    },
    {
      title: 'Nome da Categoria',
      dataIndex: 'product_category_name',
      key: 'product_category_name',
      ellipsis: true,
      sorter: (a, b) => a.product_category_name.localeCompare(b.product_category_name),
      render: (name: string, record) => (
        <Link onClick={() => navigate(`/categorias-produtos/${record.product_category_id}`)}>
          {name}
        </Link>
      ),
    },
    {
      title: 'Produtos Vinculados',
      key: 'products_count',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Tag color="blue">
          {record._count?.products || 0} produto(s)
        </Tag>
      ),
      sorter: (a, b) => (a._count?.products || 0) - (b._count?.products || 0),
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
        title="Categorias de Produtos"
        subtitle="Gerencie as categorias do catálogo de produtos"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Nova Categoria
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
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Inativos' },
            ]}
          />

          {(searchText || activeFilter !== 'active') && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('');
                setActiveFilter('active');
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
          rowKey="product_category_id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} categorias`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          size="small"
        />
      </Card>
    </div>
  );
}
