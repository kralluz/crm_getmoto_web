import { useEffect, useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  Switch,
  Row,
  Col,
  Divider,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { CategorySelect } from '../components/products/CategorySelect';
import { parseDecimal } from '../utils';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { CurrencyInput } from '../components/common/CurrencyInput';
import type { CreateProductData, UpdateProductData } from '../types/product';

interface ProductFormData {
  category_id: number;
  product_name: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  quantity_alert: number;
  is_active: boolean;
}

export function ProductForm() {
  const [form] = Form.useForm<ProductFormData>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditing = !!id;
  const productId = id ? parseInt(id) : undefined;

  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);

  const { data: product, isLoading: isLoadingProduct } = useProduct(productId);
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isLoading = isLoadingProduct;
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
        quantity: parseDecimal(product.quantity),
        quantity_alert: parseDecimal(product.quantity_alert),
        is_active: product.is_active,
      });

      setBuyPrice(parsedBuyPrice);
      setSellPrice(parsedSellPrice);
    }
  }, [product, isEditing, form]);

  const handleSubmit = async (values: ProductFormData) => {
    if (isEditing && productId) {
      const updateData: UpdateProductData = {
        category_id: values.category_id,
        product_name: values.product_name,
        buy_price: values.buy_price,
        sell_price: values.sell_price,
        quantity: values.quantity,
        quantity_alert: values.quantity_alert,
        is_active: values.is_active,
      };
      updateProduct(
        { id: productId, data: updateData },
        {
          onSuccess: () => {
            navigate('/produtos');
          },
        }
      );
    } else {
      const createData: CreateProductData = {
        category_id: values.category_id,
        product_name: values.product_name,
        buy_price: values.buy_price,
        sell_price: values.sell_price,
        quantity: values.quantity || 0,
        quantity_alert: values.quantity_alert || 0,
        is_active: values.is_active !== false,
      };
      createProduct(createData, {
        onSuccess: () => {
          navigate('/produtos');
        },
      });
    }
  };

  const handleCancel = () => {
    navigate('/produtos');
  };

  const validateSellPrice = (_: any, value: number) => {
    const buyPrice = form.getFieldValue('buy_price');
    if (value && buyPrice && value < buyPrice) {
      return Promise.reject(t('products.salePriceValidation'));
    }
    return Promise.resolve();
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={handleCancel} style={{ marginBottom: 16 }}>
        {t('common.back')}
      </Button>
      <PageHeader
        title={isEditing ? t('products.editProduct') : t('products.newProduct')}
        subtitle={isEditing ? `${t('products.editingProduct')}: ${product?.product_name}` : t('products.newProductSubtitle')}
      />
      <Card loading={isSaving}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ is_active: true, quantity: 0, quantity_alert: 0 }} style={{ maxWidth: 900 }}>
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Form.Item label={t('products.productName')} name="product_name" rules={[{ required: true, message: t('products.productNameRequired') },{ min: 3, message: t('products.productNameMinLength') },{ max: 200, message: t('products.productNameMaxLength') }]}>
                <Input placeholder={t('products.productNamePlaceholder')} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('products.category')} name="category_id" rules={[{ required: true, message: t('products.categoryRequired') }]}>
                <CategorySelect size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">{t('products.prices')}</Divider>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item label={t('products.costPriceLabel')} name="buy_price" rules={[{ required: true, message: t('products.costPriceRequired') },{ type: 'number', min: 0, message: t('products.costPricePositive') }]} tooltip={t('products.costPriceTooltip')}>
                <CurrencyInput
                  style={{ width: '100%' }}
                  placeholder="£0.00"
                  onChange={(value) => {
                    setBuyPrice(value || 0);
                    form.validateFields(['sell_price']);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('products.salePriceLabel')} name="sell_price" rules={[{ required: true, message: t('products.salePriceRequired') },{ type: 'number', min: 0, message: t('products.salePricePositive') },{ validator: validateSellPrice }]} tooltip={t('products.salePriceTooltip')}>
                <CurrencyInput
                  style={{ width: '100%' }}
                  placeholder="£0.00"
                  onChange={(value) => setSellPrice(value || 0)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('products.profitMargin')} tooltip={t('products.profitMarginTooltip')}>
                <Input
                  value={calculateMargin()}
                  readOnly
                  size="large"
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
            <Col xs={24} md={12}>
              <Form.Item label={t('products.stockQuantityLabel')} name="quantity" rules={[{ required: true, message: t('products.stockQuantityRequired') },{ type: 'number', min: 0, message: t('products.stockQuantityPositive') }]} tooltip={t('products.stockQuantityTooltip')}>
                <InputNumber style={{ width: '100%' }} precision={0} min={0} placeholder="0" size="large" suffix="unid." step={1} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('products.minStockLabel')} name="quantity_alert" rules={[{ required: true, message: t('products.minStockRequired') },{ type: 'number', min: 0, message: t('products.minStockPositive') }]} tooltip={t('products.minStockTooltip')}>
                <InputNumber style={{ width: '100%' }} precision={0} min={0} placeholder="0" size="large" suffix="unid." step={1} />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Form.Item label={t('common.status')} name="is_active" valuePropName="checked">
            <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
          </Form.Item>
          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" loading={isSaving}>
                {isEditing ? t('products.updateProduct') : t('products.createProduct')}
              </Button>
              <Button onClick={handleCancel} size="large" disabled={isSaving}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
