import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Typography, Space, Select, Button, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, KeyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { User, UserRole } from '../types/user';
import dayjs from 'dayjs';

const { Title } = Typography;

export function UserList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | ''>('');

  // Mock data - substituir por chamada real à API
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Admin Sistema',
      email: 'admin@getmoto.com',
      role: 'ADMIN',
      active: true,
      createdAt: '2024-01-10',
      updatedAt: '2024-10-20',
    },
    {
      id: '2',
      name: 'Carlos Gerente',
      email: 'carlos@getmoto.com',
      role: 'MANAGER',
      active: true,
      createdAt: '2024-02-15',
      updatedAt: '2024-10-20',
    },
    {
      id: '3',
      name: 'João Mecânico',
      email: 'joao@getmoto.com',
      role: 'MECHANIC',
      active: true,
      createdAt: '2024-03-20',
      updatedAt: '2024-10-20',
    },
    {
      id: '4',
      name: 'Maria Atendente',
      email: 'maria@getmoto.com',
      role: 'ATTENDANT',
      active: false,
      createdAt: '2024-04-05',
      updatedAt: '2024-09-10',
    },
  ];

  const isLoading = false;

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      const matchesSearch = searchText === '' ||
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase());

      const matchesRole = selectedRole === '' || user.role === selectedRole;
      const matchesStatus = selectedStatus === '' ||
        (selectedStatus === 'active' && user.active) ||
        (selectedStatus === 'inactive' && !user.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [mockUsers, searchText, selectedRole, selectedStatus]);

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

  const handleDelete = (id: string) => {
    // TODO: Implementar modal de confirmação e chamada à API
    console.log('Delete user:', id);
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
          <Tooltip title={t('users.delete')}>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
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
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => t('users.totalUsers', { total }),
          }}
          size="small"
        />
      </Card>
    </div>
  );
}
