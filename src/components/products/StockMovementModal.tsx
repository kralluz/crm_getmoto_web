import { Modal, Form, Input, InputNumber, Space, Select, Radio, Alert } from 'antd';
import { useEffect, useState } from 'react';
import { useCreateStockMove } from '../../hooks/useProducts';
import type { Product, CreateStockMoveData } from '../../types/product';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface StockMovementModalProps {
  product?: Product;
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
  const { t } = useTranslation();
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');

  const ADJUSTMENT_REASONS = [
    { label: t('stockAdjustment.reasons.breakage') || 'Quebra/Dano', value: 'breakage' },
    { label: t('stockAdjustment.reasons.expiration') || 'Vencimento', value: 'expiration' },
    { label: t('stockAdjustment.reasons.inventory_correction') || 'Correção de Inventário', value: 'inventory_correction' },
    { label: t('stockAdjustment.reasons.theft') || 'Perda/Roubo', value: 'theft' },
    { label: t('stockAdjustment.reasons.other') || 'Outro', value: 'other' },
  ];

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        adjustment_type: 'increase',
        quantity: 1,
      });
      setAdjustmentType('increase');
    }
  }, [open, form]);

  const handleAdjustmentTypeChange = (value: 'increase' | 'decrease') => {
    setAdjustmentType(value);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (!product) {
        console.error('Nenhum produto selecionado');
        return;
      }
      
      // Determinar o tipo de movimento baseado no tipo de ajuste
      const moveType = adjustmentType === 'increase' ? 'ENTRY' : 'EXIT';
      
      // Incluir a razão nas notes
      let notes = values.notes || '';
      if (values.reason) {
        const reasonLabel = ADJUSTMENT_REASONS.find(r => r.value === values.reason)?.label || values.reason;
        notes = `[${reasonLabel}] ${notes}`.trim();
      }
      
      const data: CreateStockMoveData = {
        product_id: product.product_id,
        move_type: moveType,
        quantity: values.quantity,
        notes: notes || undefined,
      };

      await createStockMove.mutateAsync(data);
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error) {
      // Validation error ou erro da mutation
      console.error('Erro ao ajustar estoque:', error);
    }
  };

  return (
    <Modal
      title={t('stockAdjustment.title') || 'Ajuste de Estoque'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={createStockMove.isPending}
      okText={t('stockAdjustment.applyAdjustment') || 'Aplicar Ajuste'}
      cancelText={t('common.cancel') || 'Cancelar'}
      width={500}
    >
      {open && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            adjustment_type: 'increase',
            quantity: 1,
          }}
        >
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                {t('stockAdjustment.adjustmentInfo')}
              </Space>
            }
            description={t('stockAdjustment.adjustmentDescription')}
            type="warning"
            showIcon={false}
            style={{ marginBottom: 16 }}
            closable
          />

          {product && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <strong>{t('products.product') || 'Produto'}:</strong> {product.product_name}
              <br />
              <strong>{t('inventory.currentStock') || 'Estoque Atual'}:</strong> {product.quantity} {t('inventory.units') || 'unidades'}
            </div>
          )}

          <Form.Item
            label={t('stockAdjustment.type') || 'Tipo'}
            name="adjustment_type"
            rules={[{ required: true, message: t('stockAdjustment.typeRequired') || 'Selecione o tipo de ajuste' }]}
          >
            <Radio.Group onChange={(e) => handleAdjustmentTypeChange(e.target.value)}>
              <Space direction="vertical">
                <Radio value="increase">{t('stockAdjustment.increase') || 'Aumentar (ex: encontrado)'}</Radio>
                <Radio value="decrease">{t('stockAdjustment.decrease') || 'Reduzir (ex: quebrou)'}</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

                    <Form.Item
            label={t('inventory.quantity') || 'Quantidade'}
            name="quantity"
            rules={[
              { required: true, message: t('inventory.quantityRequired') || 'Quantidade é obrigatória' },
              { type: 'number', min: 1, message: t('stockAdjustment.quantityPositive') || 'Quantidade deve ser positiva' },
              {
                validator: (_, value) => {
                  if (product && adjustmentType === 'decrease' && value > product.quantity) {
                    return Promise.reject(new Error(t('stockAdjustment.insufficientStock') || 'Estoque insuficiente'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={1}
              step={1}
              style={{ width: '100%' }}
              placeholder={t('stockAdjustment.quantityPlaceholder') || 'Digite a quantidade'}
            />
          </Form.Item>

          <Form.Item
            label={t('stockAdjustment.reason') || 'Motivo'}
            name="reason"
            rules={[{ required: true, message: t('stockAdjustment.reasonRequired') || 'Selecione um motivo' }]}
          >
            <Select
              placeholder={t('stockAdjustment.reasonPlaceholder') || 'Selecione o motivo'}
              options={ADJUSTMENT_REASONS}
            />
          </Form.Item>

          <Form.Item
            label={t('inventory.observations') || 'Observações'}
            name="notes"
            rules={[
              {
                validator: (_, value) => {
                  const reason = form.getFieldValue('reason');
                  if (reason === 'other' && !value) {
                    return Promise.reject(new Error(t('stockAdjustment.observationsRequired') || 'Observações são obrigatórias para "Outro"'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TextArea
              rows={3}
              placeholder={t('stockAdjustment.notesPlaceholder') || 'Adicione detalhes sobre o ajuste (opcional)'}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
