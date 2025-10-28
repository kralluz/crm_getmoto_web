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
  Switch,
  message
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

const { confirm } = Modal;

export function UsersSettings() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    const labels: Record<UserRole, string> = {
      ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      MECHANIC: 'Mecânico',
      ATTENDANT: 'Atendente',
    };
    return labels[role];
  };

  const handleCreate = () => {
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
      title: 'Deletar Usuário',
      icon: <ExclamationCircleOutlined />,
      content: `Tem certeza que deseja deletar o usuário "${user.name}"?`,
      okText: 'Sim, deletar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        deleteUser(user.id, {
          onSuccess: () => {
            message.success('Usuário deletado com sucesso!');
          },
          onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Erro ao deletar usuário');
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
              message.success('Senha alterada com sucesso!');
              setIsPasswordModalOpen(false);
              passwordForm.resetFields();
              setPasswordUserId(null);
            },
            onError: (error: any) => {
              message.error(error?.response?.data?.message || 'Erro ao alterar senha');
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
              message.success('Usuário atualizado com sucesso!');
              setIsModalOpen(false);
              form.resetFields();
              setEditingUser(null);
            },
            onError: (error: any) => {
              message.error(error?.response?.data?.message || 'Erro ao atualizar usuário');
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
            message.success('Usuário criado com sucesso!');
            setIsModalOpen(false);
            form.resetFields();
          },
          onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Erro ao criar usuário');
          },
        });
      }
    });
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Ações',
      key: 'actions',
      width: 140,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Alterar senha">
            <Button
              type="text"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleChangePassword(record.id)}
            />
          </Tooltip>
          <Tooltip title="Deletar">
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
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Cargo',
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
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
    },
    {
      title: 'Data Cadastro',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      align: 'center',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
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
            Novo Usuário
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
            showTotal: (total) => `Total: ${total} usuários`,
          }}
        />
      </Card>

      {/* Modal de Criar/Editar */}
      <Modal
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingUser(null);
        }}
        okText={editingUser ? 'Atualizar' : 'Criar'}
        cancelText="Cancelar"
        confirmLoading={isCreating || isUpdating}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nome"
            name="name"
            rules={[
              { required: true, message: 'Nome é obrigatório' },
              { min: 3, max: 100, message: 'Nome deve ter entre 3 e 100 caracteres' }
            ]}
          >
            <Input placeholder="Nome completo" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email é obrigatório' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input placeholder="email@exemplo.com" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="Senha"
              name="password"
              rules={[
                { required: true, message: 'Senha é obrigatória' },
                { min: 6, message: 'Senha deve ter no mínimo 6 caracteres' }
              ]}
            >
              <Input.Password placeholder="Senha inicial" />
            </Form.Item>
          )}

          <Form.Item
            label="Cargo"
            name="role"
            rules={[{ required: true, message: 'Cargo é obrigatório' }]}
          >
            <Select placeholder="Selecione o cargo">
              <Select.Option value="ADMIN">Administrador</Select.Option>
              <Select.Option value="MANAGER">Gerente</Select.Option>
              <Select.Option value="MECHANIC">Mecânico</Select.Option>
              <Select.Option value="ATTENDANT">Atendente</Select.Option>
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item
              label="Status"
              name="active"
              valuePropName="checked"
            >
              <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Modal de Alterar Senha */}
      <Modal
        title="Alterar Senha"
        open={isPasswordModalOpen}
        onOk={handleSubmitPassword}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          passwordForm.resetFields();
          setPasswordUserId(null);
        }}
        okText="Alterar"
        cancelText="Cancelar"
        confirmLoading={isChangingPassword}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nova Senha"
            name="password"
            rules={[
              { required: true, message: 'Senha é obrigatória' },
              { min: 6, message: 'Senha deve ter no mínimo 6 caracteres' }
            ]}
          >
            <Input.Password placeholder="Digite a nova senha" />
          </Form.Item>

          <Form.Item
            label="Confirmar Senha"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirme a senha' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('As senhas não coincidem'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirme a nova senha" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
