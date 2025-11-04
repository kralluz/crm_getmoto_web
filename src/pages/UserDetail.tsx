import { Card, Descriptions, Tag, Typography, Space, Button, Divider } from 'antd';
import { ArrowLeftOutlined, UserOutlined, EditOutlined, KeyOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { User, UserRole } from '../types/user';

const { Title, Text } = Typography;

export function UserDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock data - substituir por chamada real à API
  const user: User = {
    id: id || '1',
    name: 'João Mecânico',
    email: 'joao@getmoto.com',
    role: 'MECHANIC',
    active: true,
    createdAt: '2024-03-20',
    updatedAt: '2024-10-20',
  };

  const handleBack = () => {
    navigate('/usuarios');
  };

  const handleEdit = () => {
    navigate(`/usuarios/${id}/editar`);
  };

  const handleChangePassword = () => {
    navigate(`/usuarios/${id}/alterar-senha`);
  };

  const formatDate = (date: string | Date) => {
    return dayjs(date).format('DD/MM/YYYY HH:mm');
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

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
        style={{ marginBottom: 16 }}
      >
        Voltar
      </Button>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Space>
              <UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {user.name}
                </Title>
                <Text type="secondary">{user.email}</Text>
              </div>
            </Space>

            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                Editar
              </Button>
              <Button
                icon={<KeyOutlined />}
                onClick={handleChangePassword}
              >
                Alterar Senha
              </Button>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label="Nome completo">
              {user.name}
            </Descriptions.Item>

            <Descriptions.Item label="Email">
              {user.email}
            </Descriptions.Item>

            <Descriptions.Item label="Cargo">
              <Tag color={getRoleColor(user.role)}>
                {getRoleLabel(user.role)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label={t('common.status')}>
              <Tag color={user.active ? 'success' : 'default'}>
                {user.active ? t('common.active') : t('common.inactive')}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Data de cadastro">
              {formatDate(user.createdAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Última atualização">
              {formatDate(user.updatedAt)}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <div>
            <Title level={4}>Permissões por cargo</Title>
            <Descriptions column={1} bordered>
              {user.role === 'ADMIN' && (
                <>
                  <Descriptions.Item label="Administrador">
                    <Space direction="vertical" size="small">
                      <Text>✅ Acesso total ao sistema</Text>
                      <Text>✅ Gerenciar usuários</Text>
                      <Text>✅ Gerenciar configurações</Text>
                      <Text>✅ Visualizar relatórios financeiros</Text>
                      <Text>✅ Gerenciar produtos, serviços e clientes</Text>
                    </Space>
                  </Descriptions.Item>
                </>
              )}

              {user.role === 'MANAGER' && (
                <>
                  <Descriptions.Item label="Gerente">
                    <Space direction="vertical" size="small">
                      <Text>✅ Visualizar relatórios financeiros</Text>
                      <Text>✅ Gerenciar produtos e estoque</Text>
                      <Text>✅ Gerenciar serviços</Text>
                      <Text>✅ Gerenciar clientes</Text>
                      <Text>❌ Gerenciar usuários</Text>
                      <Text>❌ Alterar configurações do sistema</Text>
                    </Space>
                  </Descriptions.Item>
                </>
              )}

              {user.role === 'MECHANIC' && (
                <>
                  <Descriptions.Item label="Mecânico">
                    <Space direction="vertical" size="small">
                      <Text>✅ Visualizar e atualizar serviços</Text>
                      <Text>✅ Registrar uso de produtos</Text>
                      <Text>✅ Visualizar clientes</Text>
                      <Text>❌ Criar/Deletar serviços</Text>
                      <Text>❌ Gerenciar produtos</Text>
                      <Text>❌ Visualizar relatórios financeiros</Text>
                    </Space>
                  </Descriptions.Item>
                </>
              )}

              {user.role === 'ATTENDANT' && (
                <>
                  <Descriptions.Item label="Atendente">
                    <Space direction="vertical" size="small">
                      <Text>✅ Criar e gerenciar serviços</Text>
                      <Text>✅ Gerenciar clientes</Text>
                      <Text>✅ Visualizar produtos</Text>
                      <Text>❌ Gerenciar estoque</Text>
                      <Text>❌ Visualizar relatórios financeiros</Text>
                      <Text>❌ Gerenciar usuários</Text>
                    </Space>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </div>
        </Space>
      </Card>
    </div>
  );
}
