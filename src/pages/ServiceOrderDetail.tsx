import { Card, Descriptions, Tag, Typography, Space, Button, Divider } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface ServiceOrderDetailProps {
  orderId: string;
  onBack: () => void;
}

export function ServiceOrderDetail({ orderId, onBack }: ServiceOrderDetailProps) {
  // Mock data - substituir por chamada real à API
  const order = {
    id: orderId,
    orderNumber: 'OS-1234',
    clientName: 'João Silva',
    vehiclePlate: 'ABC-1234',
    status: 'in_progress' as const,
    description: 'Revisão completa dos 10.000km - Troca de óleo, filtros, velas e regulagem',
    totalAmount: 450.00,
    createdAt: '2024-10-15',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'in_progress':
        return 'processing';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 16 }}
      >
        Voltar
      </Button>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space>
              <FileTextOutlined style={{ fontSize: 32, color: '#13c2c2' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {order.orderNumber}
                </Title>
                <Text type="secondary">
                  Criada em {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label="Cliente">
              <Text strong>{order.clientName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Veículo">
              <Text strong>{order.vehiclePlate}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Valor Total">
              <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                {formatCurrency(order.totalAmount)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Descrição do Serviço" span={2}>
              {order.description}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>
    </div>
  );
}
