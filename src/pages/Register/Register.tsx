import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth-store';
import type { RegisterData } from '../../types/auth';
import './Register.css';

const { Title, Text } = Typography;

export function Register() {
  const navigate = useNavigate();
  const { login: setAuthState } = useAuthStore();
  const registerMutation = useRegister();
  const [form] = Form.useForm();

  const handleSubmit = async (values: RegisterData & { confirmPassword: string }) => {
    try {
      // Remove confirmPassword antes de enviar para API
      const { confirmPassword, ...registerData } = values;

      const response = await registerMutation.mutateAsync(registerData);

      // Atualiza estado global com dados do usuário e token
      setAuthState(response.user, response.token);

      // Armazena refresh token se existir
      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken);
      }

      // Redireciona para dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Erro já tratado pelo mutation e exibido via notification
      console.error('Register error:', error);
    }
  };

  return (
    <div className="register-container">
      <Card className="register-card">
        <div className="register-header">
          <Title level={2}>Criar Conta</Title>
          <Text type="secondary">Preencha os dados abaixo para se cadastrar</Text>
        </div>

        {registerMutation.isError && (
          <Alert
            message="Erro ao criar conta"
            description={
              (registerMutation.error as any)?.status === 409
                ? 'Este email já está cadastrado. Por favor, use outro email ou faça login.'
                : registerMutation.error?.message ||
                  'Não foi possível criar sua conta. Verifique os dados e tente novamente.'
            }
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Nome Completo"
            rules={[
              { required: true, message: 'Por favor, insira seu nome' },
              { min: 3, message: 'Nome deve ter no mínimo 3 caracteres' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="João Silva"
              autoComplete="name"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Por favor, insira seu email' },
              { type: 'email', message: 'Email inválido' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Senha"
            rules={[
              { required: true, message: 'Por favor, insira sua senha' },
              { min: 8, message: 'Senha deve ter no mínimo 8 caracteres' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Senha deve conter letras maiúsculas, minúsculas e números',
              },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmar Senha"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Por favor, confirme sua senha' },
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
              prefix={<LockOutlined />}
              placeholder="Confirme sua senha"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<UserAddOutlined />}
              loading={registerMutation.isPending}
              block
            >
              Criar Conta
            </Button>
          </Form.Item>
        </Form>

        <Divider>ou</Divider>

        <div className="register-footer">
          <Text>
            Já tem uma conta? <Link to="/login">Fazer login</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
