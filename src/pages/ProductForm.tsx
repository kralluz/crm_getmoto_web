import { useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, Space, Switch, Row, Col, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { CategorySelect } from '../components/products/CategorySelect';
import { parseDecimal } from '../utils';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
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
  const isEditing = !!id;
  const productId = id ? parseInt(id) : undefined;

  const { data: product, isLoading: isLoadingProduct } = useProduct(productId);
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isLoading = isLoadingProduct;
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (product && isEditing) {
      form.setFieldsValue({
        category_id: product.category_id,
        product_name: product.product_name,
        buy_price: parseDecimal(product.buy_price),
        sell_price: parseDecimal(product.sell_price),
        quantity: parseDecimal(product.quantity),
        quantity_alert: parseDecimal(product.quantity_alert),
        is_active: product.is_active,
      });
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
      return Promise.reject('O preço de venda deve ser maior ou igual ao preço de compra');
    }
    return Promise.resolve();
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={handleCancel} style={{ marginBottom: 16 }}>
        Voltar
      </Button>
      <PageHeader
        title={isEditing ? 'Editar Produto' : 'Novo Produto'}
        subtitle={isEditing ? `Editando: ${product?.product_name}` : 'Cadastre um novo produto no estoque'}
      />
      <Card loading={isSaving}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ is_active: true, quantity: 0, quantity_alert: 0 }} style={{ maxWidth: 900 }}>
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Form.Item label="Nome do Produto" name="product_name" rules={[{ required: true, message: 'Por favor, informe o nome do produto' },{ min: 3, message: 'O nome deve ter pelo menos 3 caracteres' },{ max: 200, message: 'O nome deve ter no máximo 200 caracteres' }]}>
                <Input placeholder="Ex: Óleo Motul 15W-40" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Categoria" name="category_id" rules={[{ required: true, message: 'Por favor, selecione a categoria' }]}>
                <CategorySelect size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">Preços</Divider>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item label="Preço de Compra" name="buy_price" rules={[{ required: true, message: 'Informe o preço de compra' },{ type: 'number', min: 0, message: 'O preço deve ser maior ou igual a zero' }]} tooltip="Preço pelo qual você compra o produto">
                <InputNumber style={{ width: '100%' }} prefix="R$" precision={2} min={0} placeholder="0,00" size="large" onChange={() => form.validateFields(['sell_price'])} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Preço de Venda" name="sell_price" rules={[{ required: true, message: 'Informe o preço de venda' },{ type: 'number', min: 0, message: 'O preço deve ser maior ou igual a zero' },{ validator: validateSellPrice }]} tooltip="Preço pelo qual você vende o produto">
                <InputNumber style={{ width: '100%' }} prefix="R$" precision={2} min={0} placeholder="0,00" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Margem de Lucro" tooltip="Calculado automaticamente com base nos preços">
                <Input value={(() => { const buyPrice = form.getFieldValue('buy_price'); const sellPrice = form.getFieldValue('sell_price'); if (buyPrice && sellPrice && buyPrice > 0) { const margin = ((sellPrice - buyPrice) / buyPrice) * 100; return `${margin.toFixed(2)}%`; } return '-'; })()} readOnly size="large" style={{ fontWeight: 600, color: (() => { const buyPrice = form.getFieldValue('buy_price'); const sellPrice = form.getFieldValue('sell_price'); if (buyPrice && sellPrice) { const margin = ((sellPrice - buyPrice) / buyPrice) * 100; return margin >= 30 ? '#52c41a' : margin >= 15 ? '#fa8c16' : '#ff4d4f'; } return undefined; })() }} />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">Estoque</Divider>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Quantidade em Estoque" name="quantity" rules={[{ required: true, message: 'Informe a quantidade' },{ type: 'number', min: 0, message: 'A quantidade não pode ser negativa' }]} tooltip="Quantidade atual disponível em estoque">
                <InputNumber style={{ width: '100%' }} precision={1} min={0} placeholder="0" size="large" suffix="unid." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Estoque Mínimo (Alerta)" name="quantity_alert" rules={[{ required: true, message: 'Informe o estoque mínimo' },{ type: 'number', min: 0, message: 'O valor não pode ser negativo' }]} tooltip="Você será alertado quando o estoque atingir ou ficar abaixo deste valor">
                <InputNumber style={{ width: '100%' }} precision={1} min={0} placeholder="0" size="large" suffix="unid." />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Form.Item label="Status" name="is_active" valuePropName="checked">
            <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
          </Form.Item>
          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" loading={isSaving}>
                {isEditing ? 'Atualizar Produto' : 'Criar Produto'}
              </Button>
              <Button onClick={handleCancel} size="large" disabled={isSaving}>Cancelar</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
