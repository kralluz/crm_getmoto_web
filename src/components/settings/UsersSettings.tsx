import { useState } from 'react';
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
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useChangePassword } from '../../hooks/useUsers';
import type { User, UserRole, CreateUserInput, UpdateUserInput } from '../../types/user';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { NotificationService } from '../../services/notification.service';

const { confirm } = Modal;

export function UsersSettings() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const { data: users = [], isLoading } = useUsers();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();

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
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    confirm({
      title: t('users.deleteUser'),
      icon: <ExclamationCircleOutlined />,
      content: t('users.deleteUserConfirm', { name: user.name }),
      okText: t('users.yesDelete'),
      okType: 'danger',
      cancelText: t('users.cancel'),
      onOk() {
        deleteUser(user.id, {
          onSuccess: () => {
            NotificationService.success(t('users.userDeletedSuccess'));
          },
          onError: (error: any) => {
            NotificationService.error(error?.response?.data?.message || t('users.userDeleteError'));
          },
        });
      },
    });
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
      if (editingUser) {
        // Atualizar
        const updateData: UpdateUserInput = {
          name: values.name,
          email: values.email,
          role: values.role,
          active: values.active,
        };

        updateUser(
          { id: editingUser.id, data: updateData },
          {
            onSuccess: () => {
              NotificationService.success(t('users.userUpdatedSuccess'));
              setIsModalOpen(false);
              form.resetFields();
              setEditingUser(null);
            },
            onError: (error: any) => {
              NotificationService.error(error?.response?.data?.message || t('users.userUpdateError'));
            },
          }
        );
      } else {
        // Criar
        const createData: CreateUserInput = {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        };

        createUser(createData, {
          onSuccess: () => {
            NotificationService.success(t('users.userCreatedSuccess'));
            setIsModalOpen(false);
            form.resetFields();
          },
          onError: (error: any) => {
            NotificationService.error(error?.response?.data?.message || t('users.userCreateError'));
          },
        });
      }
    });
  };

  const columns: ColumnsType<User> = [
    {
      title: t('users.actions'),
      key: 'actions',
      width: 140,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('users.edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
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
              onClick={() => handleDelete(record)}
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
      title: t('users.status'),
      dataIndex: 'active',
      key: 'active',
      width: 100,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? t('users.active') : t('users.inactive')}
        </Tag>
      ),
    },
    {
      title: t('users.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      align: 'center',
      render: (date: string) => dayjs.utc(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
  ];

  return (
    <>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            {t('users.newUser')}
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t('users.totalUsers', { total }),
          }}
        />
      </Card>

      {/* Modal de Criar/Editar */}
      <Modal
        title={editingUser ? t('users.editUser') : t('users.newUser')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingUser(null);
        }}
        okText={editingUser ? t('users.update') : t('users.create')}
        cancelText={t('users.cancel')}
        confirmLoading={isCreating || isUpdating}
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

          {!editingUser && (
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
          )}

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

          {editingUser && (
            <Form.Item
              label={t('users.status')}
              name="active"
              valuePropName="checked"
            >
              <Switch checkedChildren={t('users.active')} unCheckedChildren={t('users.inactive')} />
            </Form.Item>
          )}
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
            backgroundColor: '#fff7e6', 
            border: '1px solid #ffd666',
            borderRadius: '6px'
          }}>
            <Space direction="vertical" size="small">
              <strong style={{ color: '#d48806' }}>⚠️ Atenção sobre Permissões</strong>
              <p style={{ margin: 0, color: '#595959' }}>
                Todos os usuários do sistema possuem acesso completo às informações e funcionalidades. 
                Qualquer usuário poderá visualizar, criar, editar e excluir dados em todos os módulos do sistema.
              </p>
            </Space>
          </div>
          <p style={{ margin: 0, color: '#595959' }}>
            Deseja prosseguir com a criação do novo usuário?
          </p>
        </Space>
      </Modal>
    </>
  );
}
