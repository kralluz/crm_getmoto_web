import { Modal, Form, Input, InputNumber, Radio, Space } from 'antd';
import { useEffect } from 'react';
import { useCreateStockMove } from '../../hooks/useProducts';
import type { Product, CreateStockMoveData } from '../../types/product';

interface StockMovementModalProps {
  product: Product;
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export function StockMovementModal({
  product,
  open,
  onCancel,
  onSuccess,
}: StockMovementModalProps) {
  const [form] = Form.useForm();
  const createStockMove = useCreateStockMove();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        move_type: 'ENTRY',
        quantity: 1,
      });
    }
  }, [open, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      const data: CreateStockMoveData = {
        product_id: product.product_id,
        move_type: values.move_type,
        quantity: values.quantity,
        notes: values.notes || undefined,
      };

      await createStockMove.mutateAsync(data);
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error) {
      // Validation error ou erro da mutation
      console.error('Erro ao movimentar estoque:', error);
    }
  };

  return (
    <Modal
      title="Movimentar Estoque"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={createStockMove.isPending}
      okText="Confirmar"
      cancelText="Cancelar"
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size="large">
        <div>
          <strong>Produto:</strong> {product.product_name}
          <br />
          <strong>Estoque Atual:</strong> {product.quantity.toFixed(1)} unidades
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            move_type: 'ENTRY',
            quantity: 1,
          }}
        >
          <Form.Item
            label="Tipo de Movimentação"
            name="move_type"
            rules={[{ required: true, message: 'Selecione o tipo de movimentação' }]}
          >
            <Radio.Group>
              <Radio.Button value="ENTRY">Entrada</Radio.Button>
              <Radio.Button value="EXIT">Saída</Radio.Button>
              <Radio.Button value="ADJUSTMENT">Ajuste</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Quantidade"
            name="quantity"
            rules={[
              { required: true, message: 'Informe a quantidade' },
              { type: 'number', min: 0.01, message: 'A quantidade deve ser maior que zero' },
            ]}
          >
            <InputNumber
              min={0.01}
              step={1}
              precision={1}
              style={{ width: '100%' }}
              placeholder="Digite a quantidade"
            />
          </Form.Item>

          <Form.Item
            label="Observações"
            name="notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Adicione observações sobre esta movimentação (opcional)"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}
