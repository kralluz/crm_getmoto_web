import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Typography, Space, Select, Button, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, EyeOutlined, KeyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { User, UserRole } from '../types/user';
import dayjs from 'dayjs';
import { useUsers, useDeleteUser } from '../hooks/useUsers';
import { DeleteConfirmButton } from '../components/common/DeleteConfirmButton';

const { Title } = Typography;

export function UserList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | ''>('');
  const [pageSize, setPageSize] = useState(10);

  // Buscar usuários da API
  const activeFilter = selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined;
  const { data: users, isLoading } = useUsers({
    active: activeFilter,
    role: selectedRole || undefined,
  });
  const { mutate: deleteUser } = useDeleteUser();

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];

    return users.filter(user => {
      const matchesSearch = searchText === '' ||
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase());

      return matchesSearch;
    });
  }, [users, searchText]);

  const formatDate = (date: string) => {
    return dayjs.utc(date).format('DD/MM/YYYY');
  };

  const getRoleColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'red',
      MANAGER: 'blue',
      MECHANIC: 'green',
      ATTENDANT: 'orange',
    };
    return colors[role];
  };

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      ADMIN: t('users.roles.ADMIN'),
      MANAGER: t('users.roles.MANAGER'),
      MECHANIC: t('users.roles.MECHANIC'),
      ATTENDANT: t('users.roles.ATTENDANT'),
    };
    return labels[role];
  };

  const handleView = (id: string) => {
    navigate(`/usuarios/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/usuarios/${id}/editar`);
  };

  const handleChangePassword = (id: string) => {
    navigate(`/usuarios/${id}/alterar-senha`);
  };

  const handleDelete = async (id: string) => {
    deleteUser(id);
  };

  const columns: ColumnsType<User> = [
    {
      title: t('common.actions'),
      key: 'actions',
      width: 140,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('users.viewDetails')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}
            />
          </Tooltip>
          <Tooltip title={t('users.changePassword')}>
            <Button
              type="text"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleChangePassword(record.id)}
            />
          </Tooltip>
          <DeleteConfirmButton
            onConfirm={() => handleDelete(record.id)}
            title={t('users.deleteUser')}
            description={t('users.deleteUserConfirm', { name: record.name })}
            buttonSize="small"
            iconOnly
          />
        </Space>
      ),
    },
    {
      title: t('users.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('users.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('users.role'),
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (role: UserRole) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'active',
      key: 'active',
      width: 100,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('users.registrationDate'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      align: 'center',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
  ];

  const roleOptions = [
    { value: '', label: t('users.allRoles') },
    { value: 'ADMIN', label: t('users.roles.ADMIN') },
    { value: 'MANAGER', label: t('users.roles.MANAGER') },
    { value: 'MECHANIC', label: t('users.roles.MECHANIC') },
    { value: 'ATTENDANT', label: t('users.roles.ATTENDANT') },
  ];

  const statusOptions = [
    { value: '', label: t('users.allStatuses') },
    { value: 'active', label: t('common.active') },
    { value: 'inactive', label: t('common.inactive') },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>{t('users.title')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/usuarios/novo')}
          size="large"
        >
          {t('users.newUser')}
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder={t('users.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder={t('users.filterByRole')}
            value={selectedRole || undefined}
            onChange={(value) => setSelectedRole(value || '')}
            style={{ width: 180 }}
            allowClear
            options={roleOptions}
          />
          <Select
            placeholder={t('users.filterByStatus')}
            value={selectedStatus || undefined}
            onChange={(value) => setSelectedStatus(value || '')}
            style={{ width: 150 }}
            allowClear
            options={statusOptions}
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onShowSizeChange: (_, size) => setPageSize(size),
            showTotal: (total) => t('users.totalUsers', { total }),
          }}
          size="small"
        />
      </Card>
    </div>
  );
}
