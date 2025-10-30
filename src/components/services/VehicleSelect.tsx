import { useState } from 'react';
import { Select, Spin, Button, Modal, Form, Input, InputNumber, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { SelectProps } from 'antd';
import { useVehicles, useCreateVehicle } from '../../hooks/useMotorcycles';

interface VehicleSelectProps extends Omit<SelectProps, 'options'> {
  value?: number;
  onChange?: (value: number) => void;
  onVehicleCreated?: (vehicleId: number) => void;
}

export function VehicleSelect({ value, onChange, onVehicleCreated, ...props }: VehicleSelectProps) {
  const { data: vehicles = [], isLoading } = useVehicles({ is_active: true });
  const { mutate: createVehicle, isPending: isCreating } = useCreateVehicle();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreateVehicle = () => {
    form.validateFields().then((values) => {
      createVehicle(values, {
        onSuccess: (newVehicle: any) => {
          message.success('Veículo cadastrado com sucesso!');
          form.resetFields();
          setIsModalOpen(false);
          if (onChange && newVehicle?.vehicle_id) {
            onChange(newVehicle.vehicle_id);
          }
          if (onVehicleCreated && newVehicle?.vehicle_id) {
            onVehicleCreated(newVehicle.vehicle_id);
          }
        },
        onError: () => {
          message.error('Erro ao cadastrar veículo');
        }
      });
    });
  };

  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          showSearch
          placeholder="Selecione o veículo"
          optionFilterProp="children"
          value={value}
          onChange={onChange}
          loading={isLoading}
          notFoundContent={isLoading ? <Spin size="small" /> : 'Nenhum veículo encontrado'}
          style={{ width: 'calc(100% - 40px)' }}
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          {...props}
        >
          {vehicles.map(vehicle => {
            const displayText = `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}${vehicle.color ? ` - ${vehicle.color}` : ''}`;
            return (
              <Select.Option
                key={vehicle.vehicle_id}
                value={vehicle.vehicle_id}
                label={displayText}
              >
                <div style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  <strong>{vehicle.plate}</strong> - {vehicle.brand} {vehicle.model}
                  {vehicle.year && <span style={{ color: '#888', fontSize: '12px' }}> ({vehicle.year})</span>}
                  {vehicle.color && <span style={{ color: '#888', fontSize: '12px' }}> - {vehicle.color}</span>}
                </div>
              </Select.Option>
            );
          })}
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          title="Cadastrar novo veículo"
        />
      </Space.Compact>

      <Modal
        title="Cadastrar Novo Veículo"
        open={isModalOpen}
        onOk={handleCreateVehicle}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText="Cadastrar"
        cancelText="Cancelar"
        confirmLoading={isCreating}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Placa"
            name="plate"
            rules={[
              { required: true, message: 'Placa é obrigatória' },
              { min: 7, max: 8, message: 'Placa deve ter 7 ou 8 caracteres' }
            ]}
          >
            <Input placeholder="ABC-1234 ou ABC1D23" maxLength={8} />
          </Form.Item>

          <Form.Item
            label="Marca"
            name="brand"
            rules={[{ required: true, message: 'Marca é obrigatória' }]}
          >
            <Input placeholder="Ex: Honda, Yamaha, Suzuki" />
          </Form.Item>

          <Form.Item
            label="Modelo"
            name="model"
            rules={[{ required: true, message: 'Modelo é obrigatório' }]}
          >
            <Input placeholder="Ex: CB 300, XRE 190, Intruder 125" />
          </Form.Item>

          <Form.Item
            label="Ano"
            name="year"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1900}
              max={new Date().getFullYear() + 1}
              placeholder="Ex: 2020"
            />
          </Form.Item>

          <Form.Item
            label="Cor"
            name="color"
          >
            <Input placeholder="Ex: Preta, Vermelha, Azul" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
