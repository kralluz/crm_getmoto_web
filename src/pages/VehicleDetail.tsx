import { Card, Descriptions, Tag, Typography, Space, Button, Divider, Table, Spin, Empty } from 'antd';
import { ArrowLeftOutlined, CarOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useVehicle } from '../hooks/useMotorcycles';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehicle, isLoading } = useVehicle(id ? parseInt(id) : undefined);

  const handleBack = () => {
    navigate('/veiculos');
  };

  const handleEdit = () => {
    navigate(`/veiculos/${id}/editar`);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <Card>
        <Empty description="Veículo não encontrado" />
      </Card>
    );
  }

  const serviceOrderColumns: ColumnsType<any> = [
    {
      title: 'ID',
      dataIndex: 'service_order_id',
      key: 'service_order_id',
      width: 80,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          draft: { color: 'default', text: 'Rascunho' },
          pending: { color: 'orange', text: 'Pendente' },
          in_progress: { color: 'blue', text: 'Em Andamento' },
          completed: { color: 'green', text: 'Concluído' },
          cancelled: { color: 'red', text: 'Cancelado' },
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Descrição',
      dataIndex: 'service_description',
      key: 'service_description',
      ellipsis: true,
      render: (desc: string | null) => desc || '-',
    },
    {
      title: 'Data Criação',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Data Finalização',
      dataIndex: 'finalized_at',
      key: 'finalized_at',
      width: 130,
      render: (date: string | null) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
        >
          Voltar
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEdit}
        >
          Editar
        </Button>
      </Space>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space>
              <CarOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {vehicle.brand || 'Sem marca'} {vehicle.model || 'Sem modelo'}
                </Title>
                <Text type="secondary">Placa: {vehicle.plate}</Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label="ID">
              {vehicle.vehicle_id}
            </Descriptions.Item>
            <Descriptions.Item label="Placa">
              <Text strong>{vehicle.plate}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Marca">
              {vehicle.brand || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Modelo">
              {vehicle.model || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ano">
              {vehicle.year || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Cor">
              {vehicle.color || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={vehicle.is_active ? 'green' : 'default'}>
                {vehicle.is_active ? 'Ativo' : 'Inativo'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total de Ordens">
              <Tag color="orange">
                {vehicle._count?.service_order || 0} ordem(ns)
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Cadastrado em">
              {dayjs(vehicle.created_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Atualizado em">
              {dayjs(vehicle.updated_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>

          {vehicle.service_order && vehicle.service_order.length > 0 && (
            <>
              <Divider />
              <div>
                <Title level={4}>Histórico de Ordens de Serviço</Title>
                <Table
                  columns={serviceOrderColumns}
                  dataSource={vehicle.service_order}
                  rowKey="service_order_id"
                  pagination={false}
                  size="small"
                />
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
