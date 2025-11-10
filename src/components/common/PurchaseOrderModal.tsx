import { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  Select,
  InputNumber,
  Space,
  Table,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { NotificationService } from '../../services/notification.service';
import { useCreatePurchaseOrder } from '../../hooks/usePurchaseOrders';
import { useProducts } from '../../hooks/useProducts';
import { CurrencyInput } from './CurrencyInput';
import type { PurchaseOrderProduct } from '../../types/purchase-order';

const { TextArea } = Input;

interface PurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
}

interface PurchaseOrderFormData {
  supplier_name: string;
  purchase_date: dayjs.Dayjs;
  notes?: string;
}

interface ProductRow extends PurchaseOrderProduct {
  key: string;
  product_name?: string;
}

export function PurchaseOrderModal({
  open,
  onClose,
}: PurchaseOrderModalProps) {
  const [form] = Form.useForm<PurchaseOrderFormData>();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const createPurchaseOrder = useCreatePurchaseOrder();
  const { data: availableProducts } = useProducts();
  const { t } = useTranslation();

  const productOptions =
    availableProducts?.map((p) => ({
      label: p.product_name,
      value: p.product_id,
    })) || [];

  const addProduct = () => {
    setProducts([
      ...products,
      {
        key: `product-${Date.now()}`,
        product_id: 0,
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const removeProduct = (key: string) => {
    setProducts(products.filter((p) => p.key !== key));
  };

  const updateProduct = (
    key: string,
    field: keyof ProductRow,
    value: any
  ) => {
    setProducts(
      products.map((p) => {
        if (p.key === key) {
          const updated = { ...p, [field]: value };

          // Atualizar nome do produto
          if (field === 'product_id') {
            const product = availableProducts?.find(
              (ap) => ap.product_id === value
            );
            updated.product_name = product?.product_name;
          }

          return updated;
        }
        return p;
      })
    );
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
  };

  const handleSubmit = async (values: PurchaseOrderFormData) => {
    if (products.length === 0) {
      NotificationService.error(t('purchaseOrder.atLeastOneProduct'));
      return;
    }

    const invalidProducts = products.filter(
      (p) => !p.product_id || p.quantity <= 0 || p.unit_price <= 0
    );

    if (invalidProducts.length > 0) {
      NotificationService.error(t('purchaseOrder.invalidProducts'));
      return;
    }

    try {
      await createPurchaseOrder.mutateAsync({
        supplier_name: values.supplier_name,
        purchase_date: values.purchase_date.format('YYYY-MM-DD'),
        products: products.map((p) => ({
          product_id: p.product_id,
          quantity: p.quantity,
          unit_price: p.unit_price,
        })),
        notes: values.notes,
      });

      NotificationService.success(t('purchaseOrder.successMessage'));
      form.resetFields();
      setProducts([]);
      onClose();
    } catch (error) {
      console.error('Erro ao criar ordem de compra:', error);
      NotificationService.error(t('purchaseOrder.errorMessage'));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setProducts([]);
    onClose();
  };

  const columns = [
    {
      title: t('purchaseOrder.product'),
      dataIndex: 'product_id',
      key: 'product_id',
      width: '35%',
      render: (value: number, record: ProductRow) => (
        <Select
          value={value || undefined}
          placeholder={t('purchaseOrder.selectProduct')}
          style={{ width: '100%' }}
          options={productOptions}
          onChange={(val) => updateProduct(record.key, 'product_id', val)}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
    },
    {
      title: t('purchaseOrder.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: '20%',
      render: (value: number, record: ProductRow) => (
        <InputNumber
          value={value}
          min={1}
          step={1}
          style={{ width: '100%' }}
          onChange={(val) => updateProduct(record.key, 'quantity', val || 1)}
        />
      ),
    },
    {
      title: t('purchaseOrder.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: '25%',
      render: (value: number, record: ProductRow) => (
        <CurrencyInput
          value={value}
          style={{ width: '100%' }}
          onChange={(val) => updateProduct(record.key, 'unit_price', val || 0)}
        />
      ),
    },
    {
      title: t('purchaseOrder.subtotal'),
      key: 'subtotal',
      width: '15%',
      render: (_: any, record: ProductRow) => (
        <span>
          R$ {(record.quantity * record.unit_price).toFixed(2)}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: '5%',
      render: (_: any, record: ProductRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeProduct(record.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={t('purchaseOrder.title')}
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={createPurchaseOrder.isPending}
      okText={t('purchaseOrder.submit')}
      cancelText={t('common.cancel')}
      width={900}
      destroyOnHidden
    >
      {open && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            purchase_date: dayjs(),
          }}
        >
        <Alert
          message={
            <Space>
              <InfoCircleOutlined />
              {t('purchaseOrder.stockUpdateInfo')}
            </Space>
          }
          description={t('purchaseOrder.stockUpdateDescription')}
          type="info"
          showIcon={false}
          style={{ marginBottom: 16 }}
          closable
        />

        <Form.Item
          label={t('purchaseOrder.supplier')}
          name="supplier_name"
          rules={[
            { required: true, message: t('purchaseOrder.supplierRequired') },
          ]}
        >
          <Input placeholder={t('purchaseOrder.supplierPlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('purchaseOrder.purchaseDate')}
          name="purchase_date"
          rules={[{ required: true, message: t('purchaseOrder.dateRequired') }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder={t('purchaseOrder.datePlaceholder')}
          />
        </Form.Item>

        <Form.Item label={t('purchaseOrder.products')}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Table
              columns={columns}
              dataSource={products}
              pagination={false}
              size="small"
              locale={{
                emptyText: t('purchaseOrder.noProducts'),
              }}
            />
            <Button
              type="dashed"
              onClick={addProduct}
              icon={<PlusOutlined />}
              block
            >
              {t('purchaseOrder.addProduct')}
            </Button>

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <strong>
                {t('purchaseOrder.totalAmount')}: R${' '}
                {calculateTotal().toFixed(2)}
              </strong>
            </div>
          </Space>
        </Form.Item>

        <Form.Item label={t('purchaseOrder.notes')} name="notes">
          <TextArea
            rows={3}
            placeholder={t('purchaseOrder.notesPlaceholder')}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
      )}
    </Modal>
  );
}
