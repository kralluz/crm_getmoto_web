import { Form, Input, Button, Card, Typography, Alert, Divider, Modal } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Pega a rota de onde o usuário veio (para redirecionar após login)
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Mostra o modal automaticamente quando o componente monta
  useEffect(() => {
    // Verifica se o modal já foi mostrado nesta sessão
    const modalShown = sessionStorage.getItem('migration_modal_shown');
    if (!modalShown) {
      setShowWarningModal(true);
      sessionStorage.setItem('migration_modal_shown', 'true');
    }
  }, []);

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
      <Modal
        title={
          <span>
            <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Aviso Importante
          </span>
        }
        open={showWarningModal}
        onOk={() => setShowWarningModal(false)}
        onCancel={() => setShowWarningModal(false)}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Entendi"
        centered
      >
        <Alert
          message="Migração para Produção"
          description="O sistema foi migrado para o ambiente de produção e está usando uma base de dados limpa, sendo assim é necessário criar seu primeiro usuário novamente! Agradeço a compreensão."
          type="info"
          showIcon
        />
      </Modal>

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
