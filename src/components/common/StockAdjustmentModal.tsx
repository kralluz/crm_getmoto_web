import { Modal, Form, Select, Radio, InputNumber, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { NotificationService } from '../../services/notification.service';
import { useCreateStockAdjustment } from '../../hooks/useStockAdjustments';
import { useProducts } from '../../hooks/useProducts';
import type {
  AdjustmentType,
  AdjustmentReason,
} from '../../types/stock-adjustment';

const { TextArea } = Input;

interface StockAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
}

interface StockAdjustmentFormData {
  product_id: number;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: AdjustmentReason;
  notes?: string;
}

export function StockAdjustmentModal({
  open,
  onClose,
}: StockAdjustmentModalProps) {
  const [form] = Form.useForm<StockAdjustmentFormData>();
  const createAdjustment = useCreateStockAdjustment();
  const { data: products } = useProducts();
  const { t } = useTranslation();

  const ADJUSTMENT_REASONS = [
    { label: t('stockAdjustment.reasons.breakage'), value: 'breakage' },
    { label: t('stockAdjustment.reasons.expiration'), value: 'expiration' },
    {
      label: t('stockAdjustment.reasons.inventory_correction'),
      value: 'inventory_correction',
    },
    { label: t('stockAdjustment.reasons.theft'), value: 'theft' },
    { label: t('stockAdjustment.reasons.other'), value: 'other' },
  ];

  const productOptions =
    products?.map((p) => ({
      label: `${p.product_name} (Estoque: ${p.quantity})`,
      value: p.product_id,
    })) || [];

  const handleSubmit = async (values: StockAdjustmentFormData) => {
    try {
      await createAdjustment.mutateAsync({
        product_id: values.product_id,
        adjustment_type: values.adjustment_type,
        quantity: values.quantity,
        reason: values.reason,
        notes: values.notes,
      });

      NotificationService.success(t('stockAdjustment.successMessage'));
      form.resetFields();
      onClose();
    } catch (error: any) {
      console.error('Erro ao ajustar estoque:', error);
      const errorMsg =
        error?.response?.data?.message || t('stockAdjustment.errorMessage');
      NotificationService.error(errorMsg);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t('stockAdjustment.title')}
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={createAdjustment.isPending}
      okText={t('stockAdjustment.submit')}
      cancelText={t('common.cancel')}
      width={600}
      destroyOnHidden
    >
      {open && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            adjustment_type: 'decrease',
          }}
        >
        <Form.Item
          label={t('stockAdjustment.product')}
          name="product_id"
          rules={[{ required: true, message: t('stockAdjustment.productRequired') }]}
        >
          <Select
            showSearch
            placeholder={t('stockAdjustment.productPlaceholder')}
            options={productOptions}
            filterOption={(input, option) =>
              (option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label={t('stockAdjustment.adjustmentType')}
          name="adjustment_type"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value="increase">
              {t('stockAdjustment.increase')}
            </Radio.Button>
            <Radio.Button value="decrease">
              {t('stockAdjustment.decrease')}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label={t('stockAdjustment.quantity')}
          name="quantity"
          rules={[
            { required: true, message: t('stockAdjustment.quantityRequired') },
            {
              validator: (_, value) =>
                value > 0
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(t('stockAdjustment.quantityPositive'))
                    ),
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={1}
            placeholder={t('stockAdjustment.quantityPlaceholder')}
          />
        </Form.Item>

        <Form.Item
          label={t('stockAdjustment.reason')}
          name="reason"
          rules={[{ required: true, message: t('stockAdjustment.reasonRequired') }]}
        >
          <Select
            placeholder={t('stockAdjustment.reasonPlaceholder')}
            options={ADJUSTMENT_REASONS}
          />
        </Form.Item>

        <Form.Item
          label={t('stockAdjustment.notes')}
          name="notes"
          rules={[
            {
              validator: (_, value) => {
                const reason = form.getFieldValue('reason');
                if (reason === 'other' && !value) {
                  return Promise.reject(
                    new Error(t('stockAdjustment.notesRequiredForOther'))
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <TextArea
            rows={3}
            placeholder={t('stockAdjustment.notesPlaceholder')}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
      )}
    </Modal>
  );
}
