import { Form, Input, Button, Card, Typography, Space, message } from 'antd';
import { ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface ChangePasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export function UserChangePassword() {
  const { t } = useTranslation();
  const [form] = Form.useForm<ChangePasswordFormData>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Mock: Buscar nome do usuário
  const userName = 'João Mecânico'; // TODO: Substituir por chamada à API

  const handleSubmit = async (values: ChangePasswordFormData) => {
    try {
      // TODO: Implementar chamada à API
      console.log('Change password for user:', id, values);

      message.success(t('users.passwordChangeSuccess'));
      navigate(`/usuarios/${id}`);
    } catch (error) {
      message.error(t('users.passwordChangeError'));
      console.error('Error changing password:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/usuarios/${id}`);
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleCancel}
        style={{ marginBottom: 16 }}
      >
        Voltar
      </Button>

      <Card style={{ maxWidth: 600 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              <KeyOutlined /> Alterar Senha
            </Title>
            <Text type="secondary">
              Alterando senha do usuário: <strong>{userName}</strong>
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Nova senha"
              name="newPassword"
              rules={[
                { required: true, message: t('users.passwordRequired') },
                { min: 6, message: t('users.passwordMinLength') },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: t('users.passwordMinLength'),
                },
              ]}
              extra="A senha deve ter no mínimo 6 caracteres, incluindo letras maiúsculas, minúsculas e números"
            >
              <Input.Password
                placeholder="Digite a nova senha"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Confirmar nova senha"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: t('users.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('users.passwordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirme a nova senha"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<KeyOutlined />}
                  size="large"
                >
                  Alterar Senha
                </Button>
                <Button onClick={handleCancel} size="large">
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
