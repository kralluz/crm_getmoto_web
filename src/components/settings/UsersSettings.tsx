import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  KeyOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUsers, useCreateUser, useChangePassword, useToggleUserStatus } from '../../hooks/useUsers';
import type { User, UserRole, CreateUserInput } from '../../types/user';
import { formatDate } from '../../utils/format.util';
import { useTranslation } from 'react-i18next';
import { NotificationService } from '../../services/notification.service';
import { useThemeStore } from '../../store/theme-store';
import { useQueryClient } from '@tanstack/react-query';

export function UsersSettings() {
  const { t } = useTranslation();
  const { mode } = useThemeStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pageSize, setPageSize] = useState(10);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: users = [], isLoading } = useUsers({ active: activeFilter });
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
  const { mutate: toggleStatus, isPending: isTogglingStatus } = useToggleUserStatus();

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
    return t(`users.roles.${role}`);
  };

  const handleCreate = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmCreate = () => {
    setIsConfirmModalOpen(false);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    toggleStatus(
      { id: userId, active: !currentStatus },
      {
        onSuccess: () => {
          NotificationService.success(
            !currentStatus ? t('users.userActivatedSuccess') : t('users.userDeactivatedSuccess')
          );
        },
        onError: (error: any) => {
          NotificationService.error(
            error?.response?.data?.message || t('users.statusChangeError')
          );
        },
      }
    );
  };

  const handleChangePassword = (userId: string) => {
    setPasswordUserId(userId);
    passwordForm.resetFields();
    setIsPasswordModalOpen(true);
  };

  const handleSubmitPassword = () => {
    passwordForm.validateFields().then((values) => {
      if (passwordUserId) {
        changePassword(
          { id: passwordUserId, data: { newPassword: values.password, confirmPassword: values.confirmPassword } },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
              NotificationService.success(t('users.passwordChangedSuccess'));
              setIsPasswordModalOpen(false);
              passwordForm.resetFields();
              setPasswordUserId(null);
            },
            onError: (error: any) => {
              NotificationService.error(error?.response?.data?.message || t('users.passwordChangeError'));
            },
          }
        );
      }
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const createData: CreateUserInput = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      };

      createUser(createData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
          NotificationService.success(t('users.userCreatedSuccess'));
          setIsModalOpen(false);
          form.resetFields();
        },
        onError: (error: any) => {
          console.error('Create user error:', error);
          const errorMessage = error?.response?.data?.message || error?.message;

          // Verificar se é erro de email duplicado
          if (errorMessage?.toLowerCase().includes('email') &&
              (errorMessage?.toLowerCase().includes('já') ||
               errorMessage?.toLowerCase().includes('already') ||
               errorMessage?.toLowerCase().includes('duplicate') ||
               errorMessage?.toLowerCase().includes('exists') ||
               errorMessage?.toLowerCase().includes('existe'))) {
            NotificationService.error(t('users.emailDuplicateError'));
          } else {
            NotificationService.error(errorMessage || t('users.userCreateError'));
          }
        },
      });
    });
  };

  const columns: ColumnsType<User> = [
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
      title: t('users.status'),
      dataIndex: 'active',
      key: 'active',
      width: 180,
      align: 'center',
      render: (active: boolean, record) => (
        <Tooltip title={active ? t('common.clickToDeactivate') : t('common.clickToActivate')}>
          <Switch
            checked={active}
            onChange={() => handleToggleStatus(record.id, active)}
            loading={isTogglingStatus}
            checkedChildren={t('users.active')}
            unCheckedChildren={t('users.inactive')}
          />
        </Tooltip>
      ),
    },
    {
      title: t('users.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      align: 'center',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: t('users.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={t('users.changePassword')}>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleChangePassword(record.id)}
          >
            {t('users.changePassword')}
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Card>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap', marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            {t('users.newUser')}
          </Button>

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

          {activeFilter !== true && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => setActiveFilter(true)}
            >
              {t('common.clearFilters')}
            </Button>
          )}
        </Space>

        {isMobile ? (
          <Row gutter={[16, 16]}>
            {users.map((user) => (
              <Col xs={24} key={user.id}>
                <Card
                  size="small"
                  actions={[
                    <Tooltip title={t('users.changePassword')} key="password">
                      <KeyOutlined onClick={() => handleChangePassword(user.id)} />
                    </Tooltip>,
                  ]}
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>{user.name}</strong>
                  </div>
                  <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
                    {user.email}
                  </div>
                  <Space wrap>
                    <Tag color={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Tag>
                    <Switch
                      checked={user.active}
                      onChange={() => handleToggleStatus(user.id, user.active)}
                      loading={isTogglingStatus}
                      checkedChildren={t('users.active')}
                      unCheckedChildren={t('users.inactive')}
                      size="small"
                    />
                  </Space>
                  <div style={{ marginTop: 8, fontSize: 11, color: '#8c8c8c' }}>
                    {t('users.createdAt')}: {formatDate(user.createdAt)}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            columns={columns}
            dataSource={users}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onShowSizeChange: (_, size) => setPageSize(size),
              showTotal: (total) => t('users.totalUsers', { total }),
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        )}
      </Card>

      {/* Modal de Criar Usuário */}
      <Modal
        title={t('users.newUser')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={t('users.create')}
        cancelText={t('users.cancel')}
        confirmLoading={isCreating}
        width={600}
      >
        {isModalOpen && (
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
          <Form.Item
            label={t('users.name')}
            name="name"
            rules={[
              { required: true, message: t('users.nameRequired') },
              { min: 3, max: 100, message: t('users.nameMinLength') }
            ]}
          >
            <Input placeholder={t('users.fullName')} />
          </Form.Item>

          <Form.Item
            label={t('users.email')}
            name="email"
            rules={[
              { required: true, message: t('users.emailRequired') },
              { type: 'email', message: t('users.emailInvalid') }
            ]}
          >
            <Input placeholder={t('users.emailExample')} />
          </Form.Item>

          <Form.Item
            label={t('users.password')}
            name="password"
            rules={[
              { required: true, message: t('users.passwordRequired') },
              { min: 6, message: t('users.passwordMinLength') }
            ]}
          >
            <Input.Password placeholder={t('users.initialPassword')} />
          </Form.Item>

          <Form.Item
            label={t('users.role')}
            name="role"
            rules={[{ required: true, message: t('users.roleRequired') }]}
          >
            <Select placeholder={t('users.selectRole')}>
              <Select.Option value="ADMIN">{t('users.roles.ADMIN')}</Select.Option>
              <Select.Option value="MANAGER">{t('users.roles.MANAGER')}</Select.Option>
              <Select.Option value="MECHANIC">{t('users.roles.MECHANIC')}</Select.Option>
              <Select.Option value="ATTENDANT">{t('users.roles.ATTENDANT')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
        )}
      </Modal>

      {/* Modal de Alterar Senha */}
      <Modal
        title={t('users.changePassword')}
        open={isPasswordModalOpen}
        onOk={handleSubmitPassword}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          passwordForm.resetFields();
          setPasswordUserId(null);
        }}
        okText={t('users.change')}
        cancelText={t('users.cancel')}
        confirmLoading={isChangingPassword}
      >
        {isPasswordModalOpen && (
          <Form
            form={passwordForm}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
          <Form.Item
            label={t('users.newPassword')}
            name="password"
            rules={[
              { required: true, message: t('users.passwordRequired') },
              { min: 6, message: t('users.passwordMinLength') }
            ]}
          >
            <Input.Password placeholder={t('users.passwordPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('users.confirmPassword')}
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: t('users.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('users.passwordMismatch')));
                },
              }),
            ]}
          >
            <Input.Password placeholder={t('users.confirmPasswordPlaceholder')} />
          </Form.Item>
        </Form>
        )}
      </Modal>

      {/* Modal de Confirmação para Criar Usuário */}
      <Modal
        title={t('users.newUser')}
        open={isConfirmModalOpen}
        onOk={handleConfirmCreate}
        onCancel={() => setIsConfirmModalOpen(false)}
        okText={t('common.confirm')}
        cancelText={t('users.cancel')}
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ 
            padding: '16px', 
            backgroundColor: mode === 'dark' ? '#2b2111' : '#fff7e6', 
            border: mode === 'dark' ? '1px solid #d48806' : '1px solid #ffd666',
            borderRadius: '6px'
          }}>
            <Space direction="vertical" size="small">
              <strong style={{ color: mode === 'dark' ? '#ffa940' : '#d48806' }}>⚠️ {t('users.permissionsWarningTitle')}</strong>
              <p style={{ margin: 0, color: mode === 'dark' ? '#bfbfbf' : '#595959' }}>
                {t('users.permissionsWarningMessage')}
              </p>
            </Space>
          </div>
          <p style={{ margin: 0, color: '#595959' }}>
            {t('users.createUserConfirm')}
          </p>
        </Space>
      </Modal>
    </>
  );
}
