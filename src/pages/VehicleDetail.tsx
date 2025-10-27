import { Card, Descriptions, Tag, Typography, Space, Button, Divider } from 'antd';
import { ArrowLeftOutlined, CarOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export function VehicleDetail() {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Volta para página anterior
  };
  // Mock data - substituir por chamada real à API
  const vehicle = {
    id: vehicleId,
    brand: 'Honda',
    model: 'CG 160',
    year: 2020,
    plate: 'ABC-1234',
    color: 'Vermelho',
    clientName: 'João Silva',
    clientId: '3',
    active: true,
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
              <CarOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {vehicle.brand} {vehicle.model}
                </Title>
                <Text type="secondary">Placa: {vehicle.plate}</Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label="Marca">
              {vehicle.brand}
            </Descriptions.Item>
            <Descriptions.Item label="Modelo">
              {vehicle.model}
            </Descriptions.Item>
            <Descriptions.Item label="Ano">
              {vehicle.year}
            </Descriptions.Item>
            <Descriptions.Item label="Placa">
              <Text strong>{vehicle.plate}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Cor">
              {vehicle.color}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={vehicle.active ? 'green' : 'default'}>
                {vehicle.active ? 'Ativo' : 'Inativo'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Proprietário" span={2}>
              <Text strong>{vehicle.clientName}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>
    </div>
  );
}
