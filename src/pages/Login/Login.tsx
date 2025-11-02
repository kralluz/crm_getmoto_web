import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth-store';
import type { LoginCredentials } from '../../types/auth';
import './Login.css';

const { Title, Text } = Typography;

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuthState } = useAuthStore();
  const loginMutation = useLogin();
  const [form] = Form.useForm();

  // Pega a rota de onde o usuário veio (para redirecionar após login)
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (values: LoginCredentials) => {
    try {
      const response = await loginMutation.mutateAsync(values);

      // Atualiza estado global com dados do usuário e token
      setAuthState(response.user, response.token);

      // Armazena refresh token se existir
      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken);
      }

      // Redireciona para a página original ou dashboard
      navigate(from, { replace: true });
    } catch (error) {
      // Erro já tratado pelo mutation e exibido via notification
      console.error('Login error:', error);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>CRM GetMoto</Title>
          <Text type="secondary">Faça login para continuar</Text>
        </div>

        {loginMutation.isError && (
          <Alert
            message="Erro ao fazer login"
            description="Email ou senha incorretos. Verifique suas credenciais e tente novamente."
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Por favor, insira seu email' },
              { type: 'email', message: 'Email inválido' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Senha"
            rules={[
              { required: true, message: 'Por favor, insira sua senha' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Sua senha"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<LoginOutlined />}
              loading={loginMutation.isPending}
              block
            >
              Entrar
            </Button>
          </Form.Item>
        </Form>

        <Divider>ou</Divider>

        <div className="login-footer">
          <Text>
            Não tem uma conta? <Link to="/register">Criar conta</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
