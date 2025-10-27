import { useEffect } from 'react';
import { Form, Input, Select, Button, Card, Typography, Space, Switch, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { UserRole } from '../types/user';

const { Title } = Typography;

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
}

export function UserForm() {
  const [form] = Form.useForm<UserFormData>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Mock: Carregar dados do usuário se estiver editando
  useEffect(() => {
    if (isEditing) {
      // TODO: Substituir por chamada à API
      const mockUser = {
        name: 'João Mecânico',
        email: 'joao@getmoto.com',
        role: 'MECHANIC' as UserRole,
        active: true,
      };
      form.setFieldsValue(mockUser);
    }
  }, [isEditing, id, form]);

  const handleSubmit = async (values: UserFormData) => {
    try {
      // TODO: Implementar chamada à API
      console.log('Form values:', values);

      if (isEditing) {
        message.success('Usuário atualizado com sucesso!');
      } else {
        message.success('Usuário criado com sucesso!');
      }

      navigate('/usuarios');
    } catch (error) {
      message.error('Erro ao salvar usuário. Tente novamente.');
      console.error('Error saving user:', error);
    }
  };

  const handleCancel = () => {
    navigate('/usuarios');
  };

  const roleOptions = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'MANAGER', label: 'Gerente' },
    { value: 'MECHANIC', label: 'Mecânico' },
    { value: 'ATTENDANT', label: 'Atendente' },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleCancel}
        style={{ marginBottom: 16 }}
      >
        Voltar
      </Button>

      <Card>
        <Title level={2}>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            active: true,
          }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Nome completo"
            name="name"
            rules={[
              { required: true, message: 'Por favor, informe o nome' },
              { min: 3, message: 'O nome deve ter pelo menos 3 caracteres' },
            ]}
          >
            <Input placeholder="Ex: João Silva" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Por favor, informe o email' },
              { type: 'email', message: 'Por favor, informe um email válido' },
            ]}
          >
            <Input
              placeholder="exemplo@email.com"
              size="large"
              disabled={isEditing} // Não permitir editar email
            />
          </Form.Item>

          {!isEditing && (
            <Form.Item
              label="Senha"
              name="password"
              rules={[
                { required: true, message: 'Por favor, informe a senha' },
                { min: 6, message: 'A senha deve ter pelo menos 6 caracteres' },
              ]}
            >
              <Input.Password
                placeholder="Mínimo 6 caracteres"
                size="large"
              />
            </Form.Item>
          )}

          {!isEditing && (
            <Form.Item
              label="Confirmar senha"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Por favor, confirme a senha' },
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
              <Input.Password
                placeholder="Confirme a senha"
                size="large"
              />
            </Form.Item>
          )}

          <Form.Item
            label="Cargo"
            name="role"
            rules={[{ required: true, message: 'Por favor, selecione o cargo' }]}
          >
            <Select
              placeholder="Selecione o cargo"
              size="large"
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="active"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Ativo"
              unCheckedChildren="Inativo"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
              >
                {isEditing ? 'Atualizar' : 'Criar Usuário'}
              </Button>
              <Button onClick={handleCancel} size="large">
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
