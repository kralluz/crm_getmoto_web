import { useState, useMemo } from 'react';
import {
  Table,
  Card,
  Input,
  Tag,
  Space,
  Select,
  Button,
  Switch,
  Typography,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useServiceCategories, useToggleServiceCategoryStatus } from '../hooks/useServiceCategories';
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
  const [pageSize, setPageSize] = useState(10);

  const { data: categories, isLoading } = useServiceCategories({
    is_active: activeFilter,
  });
  const { mutate: toggleStatus, isPending: isTogglingStatus } = useToggleServiceCategoryStatus();

  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories.filter((category) => {
      const matchesSearch =
        searchText === '' ||
        category.service_name.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    });
  }, [categories, searchText]);

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    toggleStatus({ id, is_active: !currentStatus });
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
      title: t('services.serviceName'),
      dataIndex: 'service_name',
      key: 'service_name',
      ellipsis: true,
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
      width: 150,
      align: 'right',
      render: (value: any) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(parseDecimal(value))}
        </span>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 180,
      align: 'center',
      render: (active: boolean, record) => (
        <Space>
          <Tooltip title={active ? t('common.clickToDeactivate') : t('common.clickToActivate')}>
            <Switch
              checked={active}
              onChange={() => handleToggleStatus(record.service_id, active)}
              loading={isTogglingStatus}
              checkedChildren={t('common.active')}
              unCheckedChildren={t('common.inactive')}
            />
          </Tooltip>
        </Space>
      ),
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
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onShowSizeChange: (_, size) => setPageSize(size),
            showTotal: (total) => t('services.totalServices', { total }),
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
