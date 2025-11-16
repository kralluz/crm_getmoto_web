import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Row,
  Col,
  Divider,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { CategorySelect } from './CategorySelect';
import { parseDecimal } from '../../utils';
import { CurrencyInput } from '../common/CurrencyInput';
import type { CreateProductData, UpdateProductData } from '../../types/product';

interface ProductFormData {
  category_id: number;
  product_name: string;
  buy_price: number;
  sell_price: number;
  quantity_alert: number;
  is_active: boolean;
}

interface ProductModalProps {
  open: boolean;
  productId?: number;
  onClose: () => void;
}

export function ProductModal({ open, productId, onClose }: ProductModalProps) {
  const [form] = Form.useForm<ProductFormData>();
  const { t } = useTranslation();
  const isEditing = !!productId;

  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);

  const { data: product } = useProduct(productId);
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isSaving = isCreating || isUpdating;

  const calculateMargin = (): string => {
    if (buyPrice && sellPrice && buyPrice > 0) {
      const margin = ((sellPrice - buyPrice) / buyPrice) * 100;
      return `${margin.toFixed(2)}%`;
    }
    return '-';
  };

  const getMarginColor = (): string | undefined => {
    if (buyPrice && sellPrice && buyPrice > 0) {
      const margin = ((sellPrice - buyPrice) / buyPrice) * 100;
      if (margin >= 30) return '#52c41a';
      if (margin >= 15) return '#fa8c16';
      return '#ff4d4f';
    }
    return undefined;
  };

  useEffect(() => {
    if (product && isEditing) {
      const parsedBuyPrice = parseDecimal(product.buy_price);
      const parsedSellPrice = parseDecimal(product.sell_price);

      form.setFieldsValue({
        category_id: product.category_id,
        product_name: product.product_name,
        buy_price: parsedBuyPrice,
        sell_price: parsedSellPrice,
        quantity_alert: parseDecimal(product.quantity_alert),
        is_active: product.is_active,
      });

      setBuyPrice(parsedBuyPrice);
      setSellPrice(parsedSellPrice);
    }
  }, [product, isEditing, form]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setBuyPrice(0);
      setSellPrice(0);
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (isEditing && productId) {
        const updateData: UpdateProductData = {
          category_id: values.category_id,
          product_name: values.product_name,
          buy_price: values.buy_price,
          sell_price: values.sell_price,
          quantity_alert: values.quantity_alert,
          is_active: values.is_active,
        };
        updateProduct(
          { id: productId, data: updateData },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
      } else {
        const createData: CreateProductData = {
          category_id: values.category_id,
          product_name: values.product_name,
          buy_price: values.buy_price,
          sell_price: values.sell_price,
          quantity: 0, // Produto começa com estoque zerado
          quantity_alert: values.quantity_alert || 0,
          is_active: values.is_active !== false,
        };
        createProduct(createData, {
          onSuccess: () => {
            onClose();
          },
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const validateSellPrice = (_: any, value: number) => {
    const buyPrice = form.getFieldValue('buy_price');
    if (value && buyPrice && value < buyPrice) {
      return Promise.reject(t('products.salePriceValidation'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={isEditing ? t('products.editProduct') : t('products.newProduct')}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditing ? t('products.updateProduct') : t('products.createProduct')}
      cancelText={t('common.cancel')}
      confirmLoading={isSaving}
      width={800}
      maskClosable={false}
    >
      {open && (
        <Form 
          form={form} 
          layout="vertical"
          preserve={false}
          initialValues={{ is_active: true, quantity_alert: 0 }}
        >
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Form.Item 
              label={t('products.productName')} 
              name="product_name" 
              rules={[
                { required: true, message: t('products.productNameRequired') },
                { min: 3, message: t('products.productNameMinLength') },
                { max: 200, message: t('products.productNameMaxLength') }
              ]}
            >
              <Input placeholder={t('products.productNamePlaceholder')} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item 
              label={t('products.category')} 
              name="category_id" 
              rules={[{ required: true, message: t('products.categoryRequired') }]}
            >
              <CategorySelect />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">{t('products.prices')}</Divider>

        <Row gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item 
              label={t('products.costPriceLabel')} 
              name="buy_price" 
              rules={[
                { required: true, message: t('products.costPriceRequired') },
                { type: 'number', min: 0, message: t('products.costPricePositive') }
              ]} 
              tooltip={t('products.costPriceTooltip')}
            >
              <CurrencyInput
                style={{ width: '100%' }}
                placeholder="£ 0.00"
                onChange={(value) => {
                  setBuyPrice(value || 0);
                  form.validateFields(['sell_price']);
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item 
              label={t('products.salePriceLabel')} 
              name="sell_price" 
              rules={[
                { required: true, message: t('products.salePriceRequired') },
                { type: 'number', min: 0, message: t('products.salePricePositive') },
                { validator: validateSellPrice }
              ]} 
              tooltip={t('products.salePriceTooltip')}
            >
              <CurrencyInput
                style={{ width: '100%' }}
                placeholder="£ 0.00"
                onChange={(value) => setSellPrice(value || 0)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item 
              label={t('products.profitMargin')} 
              tooltip={t('products.profitMarginTooltip')}
            >
              <Input
                value={calculateMargin()}
                readOnly
                style={{
                  fontWeight: 600,
                  color: getMarginColor(),
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">{t('products.stock')}</Divider>

        <Row gutter={24}>
          {isEditing && (
            <Col xs={24} md={12}>
              <Form.Item 
                label={t('products.stockQuantityLabel')} 
                tooltip={t('products.stockQuantityEditInfo')}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  precision={0} 
                  min={0} 
                  value={parseDecimal(product?.quantity || 0)}
                  disabled
                  suffix="unid." 
                />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} md={isEditing ? 12 : 24}>
            <Form.Item 
              label={t('products.minStockLabel')} 
              name="quantity_alert" 
              rules={[
                { required: true, message: t('products.minStockRequired') },
                { type: 'number', min: 0, message: t('products.minStockPositive') }
              ]} 
              tooltip={t('products.minStockTooltip')}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                precision={0} 
                min={0} 
                placeholder="0" 
                suffix="unid." 
                step={1} 
              />
            </Form.Item>
          </Col>
        </Row>

        {!isEditing && (
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#e6f7ff', 
            border: '1px solid #91d5ff', 
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#0050b3' }}>
              <strong>ℹ️ {t('products.stockInfo')}</strong>
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#096dd9' }}>
              {t('products.stockInfoDescription')}
            </p>
          </div>
        )}

        <Divider />

        <Form.Item 
          label={t('common.status')} 
          name="is_active" 
          valuePropName="checked"
        >
          <Switch 
            checkedChildren={t('common.active')} 
            unCheckedChildren={t('common.inactive')} 
          />
        </Form.Item>
      </Form>
      )}
    </Modal>
  );
}
