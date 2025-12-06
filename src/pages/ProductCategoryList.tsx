import { useState, useMemo, useEffect } from 'react';
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
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useProductCategories, useDeleteProductCategory } from '../hooks/useProductCategories';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import { ProductCategoryModal } from '../components/products/ProductCategoryModal';
import type { ProductCategory } from '../types/product-category';
import dayjs from 'dayjs';

const { Link } = Typography;

export function ProductCategoryList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | undefined>();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: categories, isLoading } = useProductCategories({
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
  });
  const { mutate: deleteCategory } = useDeleteProductCategory();

  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories.filter((category) => {
      const matchesSearch =
        searchText === '' ||
        category.product_category_name.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    });
  }, [categories, searchText]);

  const handleEdit = (id: number) => {
    setEditingCategoryId(id);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const category = categories?.find((c) => c.product_category_id === id);
    const productCount = category?._count?.products || 0;

    if (productCount > 0) {
      Modal.warning({
        title: t('products.cannotDeleteCategory'),
        icon: <ExclamationCircleOutlined />,
        content: t('products.cannotDeleteCategoryMessage', { count: productCount }),
        okText: t('products.understood'),
      });
      return;
    }

    Modal.confirm({
      title: t('products.deleteCategory'),
      icon: <ExclamationCircleOutlined />,
      content: t('products.deleteCategoryConfirm', { name: category?.product_category_name }),
      okText: t('common.yes'),
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

  const columns: ColumnsType<ProductCategory> = [
    {
      title: t('common.actions'),
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
          deleteTitle={t('products.deleteCategory')}
          deleteDescription={t('products.deleteCategoryConfirm', {
            name: record.product_category_name,
          })}
          iconOnly
        />
      ),
    },
    {
      title: t('products.categoryName'),
      dataIndex: 'product_category_name',
      key: 'product_category_name',
      ellipsis: true,
      render: (name: string, record) => (
        <Link onClick={() => navigate(`/categorias-produtos/${record.product_category_id}`)}>
          {name}
        </Link>
      ),
    },
    {
      title: t('products.linkedProducts'),
      key: 'products_count',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Tag color="blue">
          {t('products.linkedProductsCount', { count: record._count?.products || 0 })}
        </Tag>
      ),
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
    },
    {
      title: t('products.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      align: 'center',
      render: (date: string) => dayjs.utc(date).format('DD/MM/YYYY'),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('products.categoryTitle')}
        subtitle={t('products.categorySubtitle')}
        helpText={t('products.categoryPageHelp')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            {t('products.newCategory')}
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder={t('products.searchCategory')}
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
              { value: 'all', label: t('products.all') },
              { value: 'active', label: t('products.actives') },
              { value: 'inactive', label: t('products.inactives') },
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
              {t('common.clearFilters')}
            </Button>
          )}
        </Space>
      </Card>

      <Card>
        {isMobile ? (
          <Row gutter={[16, 16]}>
            {filteredCategories.map((category) => (
              <Col xs={24} key={category.product_category_id}>
                <Card
                  size="small"
                  actions={[
                    <Tooltip title={t('common.view')} key="view">
                      <EyeOutlined
                        onClick={() => navigate(`/categorias-produtos/${category.product_category_id}`)}
                      />
                    </Tooltip>,
                    <Tooltip title={t('common.edit')} key="edit">
                      <EditOutlined onClick={() => handleEdit(category.product_category_id)} />
                    </Tooltip>,
                    <Tooltip title={t('common.delete')} key="delete">
                      <DeleteOutlined
                        style={{ color: '#ff4d4f' }}
                        onClick={() => handleDelete(category.product_category_id)}
                      />
                    </Tooltip>,
                  ]}
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>{category.product_category_name}</strong>
                  </div>
                  <Space wrap>
                    <Tag color="blue">
                      {t('products.linkedProductsCount', { count: category._count?.products || 0 })}
                    </Tag>
                    <Tag color={category.is_active ? 'green' : 'default'}>
                      {category.is_active ? t('common.active') : t('common.inactive')}
                    </Tag>
                  </Space>
                  <div style={{ marginTop: 8, fontSize: 11, color: '#8c8c8c' }}>
                    {t('products.createdAt')}: {dayjs.utc(category.created_at).format('DD/MM/YYYY')}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredCategories}
            loading={isLoading}
            rowKey="product_category_id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => t('products.totalCategories', { total }),
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        )}
      </Card>

      <ProductCategoryModal
        open={modalOpen}
        categoryId={editingCategoryId}
        onClose={handleCloseModal}
      />
    </div>
  );
}
