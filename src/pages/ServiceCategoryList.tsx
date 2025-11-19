import { useState, useMemo } from 'react';
import {
  Table,
  Card,
  Input,
  Tag,
  Space,
  Select,
  Button,
  Modal,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useServiceCategories, useDeleteServiceCategory } from '../hooks/useServiceCategories';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import { ServiceCategoryModal } from '../components/services/ServiceCategoryModal';
import type { ServiceCategory } from '../types/service-category';
import { useFormat } from '../hooks/useFormat';
import { parseDecimal } from '../utils';

const { Link } = Typography;

export function ServiceCategoryList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatCurrency } = useFormat();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | undefined>();

  const { data: categories, isLoading } = useServiceCategories({
    is_active: activeFilter,
  });
  const { mutate: deleteCategory } = useDeleteServiceCategory();

  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories.filter((category) => {
      const matchesSearch =
        searchText === '' ||
        category.service_name.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    });
  }, [categories, searchText]);

  const handleDelete = async (id: number) => {
    const category = categories?.find((c) => c.service_id === id);

    Modal.confirm({
      title: t('services.deleteService'),
      icon: <ExclamationCircleOutlined />,
      content: t('services.deleteServiceConfirm', { name: category?.service_name }),
      okText: t('services.yesDelete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => {
        deleteCategory(id);
      },
    });
  };

  const handleCreate = () => {
    setEditingCategoryId(undefined);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategoryId(undefined);
  };

  const columns: ColumnsType<ServiceCategory> = [
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <ActionButtons
          onView={() => navigate(`/categorias-servicos/${record.service_id}`)}
          onDelete={() => handleDelete(record.service_id)}
          showView
          showDelete
          deleteTitle={t('services.deleteService')}
          deleteDescription={t('services.deleteServiceConfirm', { name: record.service_name })}
          iconOnly
        />
      ),
    },
    {
      title: t('services.serviceName'),
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
      title: t('services.serviceCost'),
      dataIndex: 'service_cost',
      key: 'service_cost',
      width: 120,
      align: 'right',
      render: (value: any) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(parseDecimal(value))}
        </span>
      ),
      sorter: (a, b) => parseDecimal(a.service_cost) - parseDecimal(b.service_cost),
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
  ];

  return (
    <div>
      <PageHeader
        title={t('services.title')}
        subtitle={t('services.availableServices')}
        helpText={t('services.pageHelp')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            {t('products.newServiceCategory')}
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder={t('services.searchByName')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            placeholder={t('common.status')}
            value={activeFilter}
            onChange={setActiveFilter}
            style={{ width: 150 }}
            options={[
              { value: undefined, label: t('products.all') },
              { value: true, label: t('products.actives') },
              { value: false, label: t('products.inactives') },
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
              {t('common.clearFilters')}
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
            showTotal: (total) => t('services.totalServices', { total }),
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          size="small"
        />
      </Card>

      <ServiceCategoryModal
        open={modalOpen}
        categoryId={editingCategoryId}
        onClose={handleCloseModal}
      />
    </div>
  );
}
