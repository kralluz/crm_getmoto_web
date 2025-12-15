import { Card, Descriptions, Tag, Typography, Space, Button, Divider } from 'antd';
import { ArrowLeftOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export function ClientDetail() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(-1); // Volta para a página anterior
  };

  // Mock data - substituir por chamada real à API
  const client = {
    id: clientId,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 98765-4321',
    cpf: '123.456.789-00',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    active: true,
    createdAt: '2024-01-15',
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
          <div>
            <Space>
              <UserOutlined style={{ fontSize: 32, color: '#722ed1' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {client.name}
                </Title>
                <Text type="secondary">Cliente desde {dayjs.utc(client.createdAt).format('DD/MM/YYYY')}</Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label="CPF">
              {client.cpf}
            </Descriptions.Item>
            <Descriptions.Item label={t('table.status')}>
              <Tag color={client.active ? 'green' : 'default'}>
                {client.active ? t('common.active') : t('common.inactive')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="E-mail" span={2}>
              <Space>
                <MailOutlined />
                <Text copyable>{client.email}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Telefone" span={2}>
              <Space>
                <PhoneOutlined />
                <Text copyable>{client.phone}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Endereço" span={2}>
              {client.address}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>
    </div>
  );
}
