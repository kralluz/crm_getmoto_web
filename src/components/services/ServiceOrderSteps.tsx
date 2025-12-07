import { useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  DatePicker,
  // AutoComplete, // REMOVIDO: não há mais autocomplete de customers
  Divider,
  Typography,
  Space,
  Button,
  InputNumber,
  Card,
  Table,
  Alert,
  Tooltip,
} from 'antd';
import { DeleteOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { VehicleSelect } from './VehicleSelect';
import { ServiceSelect } from './ServiceSelect';
import { ProductSelect } from '../products/ProductSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { useFormat } from '../../hooks/useFormat';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Local copies of item types to avoid circular deps
interface ProductItem {
  key: string;
  product_id?: number;
  product_qtd: number;
  unit_price?: number;
}

interface ServiceItem {
  key: string;
  service_id?: number;
  service_qtd: number;
  unit_price?: number;
}

type DiscountType = 'percent' | 'amount';

interface ServiceOrderStepsProps {
  currentStep: number;
  isEditing: boolean;
  form: ReturnType<typeof Form.useForm>[0];
  // customerOptions: { value: string; label: string }[]; // REMOVIDO: tabela customers não existe
  services: ServiceItem[];
  products: ProductItem[];
  serviceCategories: any[] | undefined;
  productsData: any[] | undefined;
  servicesTotal: number;
  productsTotal: number;
  subtotal: number;
  discountValue: number;
  grandTotal: number;
  applyDiscount: boolean;
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  setApplyDiscount: (v: boolean) => void;
  setDiscountType: (v: DiscountType) => void;
  setDiscountPercent: (v: number) => void;
  setDiscountAmount: (v: number) => void;
  selectedVehicle: any | undefined;
  handleAddService: () => void;
  handleRemoveService: (key: string) => void;
  handleServiceChange: (key: string, field: keyof ServiceItem, value: any) => void;
  handleAddProduct: () => void;
  handleRemoveProduct: (key: string) => void;
  handleProductChange: (key: string, field: keyof ProductItem, value: any) => void;
}

export function ServiceOrderSteps(props: ServiceOrderStepsProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useFormat();

  const {
    currentStep,
    isEditing,
    form,
    // customerOptions, // REMOVIDO: tabela customers não existe
    services,
    products,
    serviceCategories,
    productsData,
    servicesTotal,
    productsTotal,
    subtotal,
    discountValue,
    grandTotal,
    applyDiscount,
    discountType,
    discountPercent,
    discountAmount,
    setApplyDiscount,
    setDiscountType,
    setDiscountPercent,
    setDiscountAmount,
    selectedVehicle,
    handleAddService,
    handleRemoveService,
    handleServiceChange,
    handleAddProduct,
    handleRemoveProduct,
    handleProductChange,
  } = props;

  // Debug logs preserved from original component
  useEffect(() => {
    console.log('Step:', currentStep);
    console.log('Products data loaded:', productsData?.length || 0, 'items');
    console.log('Service categories loaded:', serviceCategories?.length || 0, 'items');
    console.log('Current products:', products);
    console.log('Current services:', services);
  }, [currentStep, productsData, serviceCategories, products, services]);

  return (
    <>
      <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
        <Title level={5}>{t('services.vehicleClientInfo')}</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('services.vehicle')}
              name="vehicle_id"
              rules={[
                { required: true, message: t('services.vehicleRequired') },
              ]}
            >
              <VehicleSelect />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={t('services.customerName')}
              name="customer_name"
              rules={[
                {
                  required: true,
                  message: t('services.customerNameRequired'),
                },
              ]}
            >
              <Input
                placeholder={t('services.customerNamePlaceholder')}
              />
            </Form.Item>
          </Col>
        </Row>

        {selectedVehicle && (
          <>
            <Divider />
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('vehicles.updateMileOdometer')}
                  name="vehicle_mile"
                  initialValue={selectedVehicle.mile || 0}
                  tooltip={t('vehicles.updateMileTooltip')}
                  rules={[
                    {
                      validator: (_, value) => {
                        const minMile = selectedVehicle.mile || 0;
                        if (value === null || value === undefined) {
                          return Promise.resolve();
                        }
                        if (value < 0) {
                          return Promise.reject(new Error(t('vehicles.mileMinError')));
                        }
                        if (value < minMile) {
                          return Promise.reject(new Error(t('vehicles.mileCannotDecrease')));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    placeholder={t('vehicles.milePlaceholder')}
                    style={{ width: '100%' }}
                    min={selectedVehicle.mile || 0}
                    parser={(value) => {
                      const parsed = Number(value);
                      const minMile = selectedVehicle.mile || 0;
                      return isNaN(parsed) || parsed < minMile ? minMile : parsed;
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </div>

      <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
        <div>
          <Title level={5}>{t('services.servicesRealized')}</Title>
          {!serviceCategories || serviceCategories.length === 0 ? (
            <Alert
              message="Atenção"
              description="Nenhum serviço disponível. Cadastre serviços antes de adicionar à ordem de serviço."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : null}
          {services.length === 0 && (
            <Alert
              message="Serviços opcionais"
              description="Você pode adicionar serviços aqui ou pular para adicionar produtos. Uma ordem de serviço deve ter pelo menos um produto OU um serviço."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {services.map((service) => {
              const serviceData = serviceCategories?.find(
                (s) => s.service_id === service.service_id
              );
              const defaultPrice = serviceData ? (Number(serviceData.service_cost) || 0) : 0;
              
              return (
                <Card key={service.key} size="small">
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={10}>
                      <Text type="secondary">{t('services.service')}</Text>
                      <ServiceSelect
                        value={service.service_id}
                        onChange={(value) => {
                          handleServiceChange(service.key, 'service_id', value);
                          // Definir preço automaticamente quando selecionar o serviço
                          const newService = serviceCategories?.find((s) => s.service_id === value);
                          if (newService) {
                            const price = Number(newService.service_cost) || 0;
                            handleServiceChange(service.key, 'unit_price', price);
                          }
                        }}
                        placeholder={t('services.selectService')}
                      />
                    </Col>
                    <Col xs={24} md={4}>
                      <Text type="secondary">{t('services.quantity')}</Text>
                      <InputNumber
                        min={1}
                        value={service.service_qtd}
                        onChange={(value) =>
                          handleServiceChange(
                            service.key,
                            'service_qtd',
                            value || 1
                          )
                        }
                        style={{ width: '100%' }}
                        parser={(value) => {
                          const parsed = Number(value);
                          return isNaN(parsed) || parsed < 1 ? 1 : parsed;
                        }}
                      />
                    </Col>
                    <Col xs={24} md={6}>
                      <Text type="secondary">{t('services.unitPrice')}</Text>
                      <CurrencyInput
                        value={service.unit_price !== undefined ? service.unit_price : defaultPrice}
                        onChange={(value) => {
                          console.log('💰 CurrencyInput onChange serviço:', service.key, 'value:', value);
                          handleServiceChange(service.key, 'unit_price', value ?? 0);
                        }}
                        style={{ width: '100%' }}
                        placeholder="£ 0.00"
                      />
                    </Col>
                    <Col xs={24} md={4}>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveService(service.key)}
                        block
                      >
                        {t('common.remove')}
                      </Button>
                    </Col>
                  </Row>
                </Card>
              );
            })}
            <Button
              type="dashed"
              onClick={handleAddService}
              icon={<PlusOutlined />}
              block
            >
              {t('services.addService')}
            </Button>
          </Space>
          {services.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t('services.servicesTotal')}:</Text>
                <Text style={{ fontSize: 20, color: '#52c41a', fontWeight: 'bold' }}>
                  {formatCurrency(servicesTotal)}
                </Text>
              </Space>
            </Card>
          )}
        </div>
      </div>

      <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
        <div>
          <Title level={5}>{t('services.productsSold')}</Title>
          
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                {t('services.stockDeductionInfo')}
              </Space>
            }
            description={t('services.stockDeductionDescription')}
            type="info"
            showIcon={false}
            style={{ marginBottom: 16 }}
            closable
          />

          {!productsData || productsData.length === 0 ? (
            <Alert
              message="Atenção"
              description="Nenhum produto disponível. Cadastre produtos antes de adicionar à ordem de serviço."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : null}
          {products.length === 0 && services.length === 0 && (
            <Alert
              message="Atenção: Produtos obrigatórios"
              description="Você não adicionou nenhum serviço ainda. É obrigatório adicionar pelo menos um produto OU um serviço para criar uma ordem de serviço."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {products.map((product) => {
              const productData = productsData?.find(
                (p) => p.product_id === product.product_id
              );
              const defaultPrice = productData ? productData.sell_price : 0;
              const availableStock = productData ? Number(productData.quantity) : 0;
              const isOutOfStock = product.product_id && availableStock === 0;
              const hasInsufficientStock = product.product_id && (product.product_qtd > availableStock || isOutOfStock);
              
              return (
                <Card
                  key={product.key}
                  size="small"
                  style={hasInsufficientStock ? { borderColor: '#ff4d4f', borderWidth: 2 } : undefined}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Row gutter={16}>
                      <Col span={24}>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary">{t('services.product')}</Text>
                          <Tooltip title={t('services.addProductTooltip')} placement="top">
                            <InfoCircleOutlined style={{ marginLeft: 6, fontSize: 12, color: '#8c8c8c', cursor: 'help' }} />
                          </Tooltip>
                        </div>
                        <ProductSelect
                          value={product.product_id}
                          onChange={(value) => {
                            handleProductChange(product.key, 'product_id', value);
                            // Resetar preço quando mudar o produto
                            const newProduct = productsData?.find((p) => p.product_id === value);
                            if (newProduct) {
                              handleProductChange(product.key, 'unit_price', newProduct.sell_price);
                            }
                          }}
                          placeholder={t('services.selectProduct')}
                        />
                      </Col>
                    </Row>

                    <Row gutter={16} align="top">
                      <Col xs={12} sm={8} md={6}>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary">{t('services.quantity')}</Text>
                        </div>
                        <InputNumber
                          min={1}
                          value={product.product_qtd}
                          onChange={(value) =>
                            handleProductChange(
                              product.key,
                              'product_qtd',
                              value || 1
                            )
                          }
                          style={{ width: '100%' }}
                          status={hasInsufficientStock ? 'error' : undefined}
                          parser={(value) => {
                            const parsed = Number(value);
                            return isNaN(parsed) || parsed < 1 ? 1 : parsed;
                          }}
                        />
                        {product.product_id && (
                          <div style={{ marginTop: 4 }}>
                            <Text
                              type={isOutOfStock ? "danger" : "secondary"}
                              style={{ fontSize: 11, fontWeight: isOutOfStock ? 'bold' : 'normal' }}
                            >
                              Disponível: {availableStock}
                            </Text>
                            {isOutOfStock && (
                              <div style={{ marginTop: 2 }}>
                                <Text type="danger" style={{ fontSize: 11, fontWeight: 'bold', display: 'block' }}>
                                  🚫 Esgotado!
                                </Text>
                              </div>
                            )}
                            {!isOutOfStock && hasInsufficientStock && (
                              <div style={{ marginTop: 2 }}>
                                <Text type="danger" style={{ fontSize: 11, display: 'block' }}>
                                  ⚠️ Ultrapassa estoque!
                                </Text>
                              </div>
                            )}
                          </div>
                        )}
                      </Col>

                      <Col xs={12} sm={8} md={8}>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary">{t('services.unitPrice')}</Text>
                        </div>
                        <CurrencyInput
                          value={product.unit_price !== undefined ? product.unit_price : defaultPrice}
                          onChange={(value) => {
                            console.log('💰 CurrencyInput onChange produto:', product.key, 'value:', value);
                            handleProductChange(product.key, 'unit_price', value ?? 0);
                          }}
                          style={{ width: '100%' }}
                          placeholder="£ 0.00"
                        />
                      </Col>

                      <Col xs={24} sm={8} md={10}>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary" style={{ opacity: 0 }}>.</Text>
                        </div>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveProduct(product.key)}
                          block
                        >
                          {t('common.remove')}
                        </Button>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              );
            })}
            <Button
              type="dashed"
              onClick={handleAddProduct}
              icon={<PlusOutlined />}
              block
            >
              {t('services.addProduct')}
            </Button>
          </Space>
          {products.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t('services.productsTotal')}:</Text>
                <Text style={{ fontSize: 20, color: '#52c41a', fontWeight: 'bold' }}>
                  {formatCurrency(productsTotal)}
                </Text>
              </Space>
            </Card>
          )}
        </div>
      </div>

      <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
        <div>
          <Title level={5}>{t('services.serviceOrderDetails')}</Title>

          <Row gutter={16}>
            <Col xs={24} md={isEditing ? 12 : 24}>
              <Form.Item
                label={t('services.professionalName')}
                name="professional_name"
              >
                <Input placeholder={t('services.professionalPlaceholder')} />
              </Form.Item>
            </Col>

            {isEditing && (
              <Col xs={24} md={12}>
                <Form.Item label={t('table.status')} name="status">
                  <Select placeholder={t('services.selectStatus')}>
                    {[
                      { value: 'draft', label: t('services.status.draft') },
                      { value: 'in_progress', label: t('services.status.in_progress') },
                      { value: 'completed', label: t('services.status.completed') },
                      { value: 'cancelled', label: t('services.status.cancelled') },
                    ].map((option) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          {isEditing && (
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('services.finalizationDate')}
                  name="finalized_at"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder={t('services.finalizationDatePlaceholder')}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item
            label={t('services.serviceDescription')}
            name="service_description"
          >
            <TextArea
              rows={3}
              placeholder={t('services.serviceDescriptionPlaceholder')}
            />
          </Form.Item>

          <Form.Item label={t('services.notes')} name="notes">
            <TextArea rows={2} placeholder={t('services.notesPlaceholder')} />
          </Form.Item>

          {!isEditing && (
            <>
              <Divider>{t('services.discount')}</Divider>
              <Form.Item>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <input
                      type="checkbox"
                      checked={applyDiscount}
                      onChange={(e) => setApplyDiscount(e.target.checked)}
                      id="apply-discount"
                    />
                    <label htmlFor="apply-discount" style={{ marginLeft: 8 }}>
                      {t('services.applyDiscount')}
                    </label>
                  </div>
                  
                  {applyDiscount && (
                    <Card size="small" style={{ backgroundColor: '#fff7e6' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Select
                          value={discountType}
                          onChange={setDiscountType}
                          style={{ width: '100%' }}
                        >
                          <Select.Option value="percent">
                            {t('services.discountPercent')}
                          </Select.Option>
                          <Select.Option value="amount">
                            {t('services.discountAmount')}
                          </Select.Option>
                        </Select>

                        {discountType === 'percent' ? (
                          <InputNumber
                            min={0}
                            max={100}
                            value={discountPercent}
                            onChange={(value) => setDiscountPercent(value || 0)}
                            addonAfter="%"
                            style={{ width: '100%' }}
                            placeholder="0"
                            parser={(value) => {
                              const parsed = Number(value);
                              if (isNaN(parsed) || parsed < 0) return 0;
                              if (parsed > 100) return 100;
                              return parsed;
                            }}
                          />
                        ) : (
                          <CurrencyInput
                            value={discountAmount}
                            onChange={(value) => setDiscountAmount(value || 0)}
                            style={{ width: '100%' }}
                            placeholder="£ 0.00"
                          />
                        )}
                      </Space>
                    </Card>
                  )}
                </Space>
              </Form.Item>

              <Card style={{ marginTop: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row justify="space-between">
                    <Text>{t('services.servicesTotal')}:</Text>
                    <Text strong>{formatCurrency(servicesTotal)}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text>{t('services.productsTotal')}:</Text>
                    <Text strong>{formatCurrency(productsTotal)}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text strong>{t('services.subtotal')}:</Text>
                    <Text strong>{formatCurrency(subtotal)}</Text>
                  </Row>
                  {applyDiscount && discountValue > 0 && (
                    <Row justify="space-between">
                      <Text type="danger">{t('services.discountValue')}:</Text>
                      <Text type="danger" strong>
                        - {formatCurrency(discountValue)}
                      </Text>
                    </Row>
                  )}
                  <Divider style={{ margin: '8px 0' }} />
                  <Row justify="space-between">
                    <Text strong style={{ fontSize: 16 }}>
                      {t('services.grandTotal')}:
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: 20, color: '#52c41a', fontWeight: 'bold' }}
                    >
                      {formatCurrency(grandTotal)}
                    </Text>
                  </Row>
                </Space>
              </Card>
            </>
          )}
        </div>
      </div>

      <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
        <div>
          <Title level={5}>{t('services.orderConfirmation')}</Title>
          
          <Card title={t('services.vehicleClientInfo')} size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text type="secondary">{t('services.vehicle')}:</Text>
                <Text strong>
                  {selectedVehicle
                    ? `${selectedVehicle.plate} - ${selectedVehicle.brand} ${selectedVehicle.model}`
                    : t('common.notInformed')}
                </Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">{t('services.customerName')}:</Text>
                <Text strong>{form.getFieldValue('customer_name')}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">{t('services.professionalName')}:</Text>
                <Text strong>{form.getFieldValue('professional_name') || t('common.notInformed')}</Text>
              </Row>
            </Space>
          </Card>

          {services.length > 0 && (
            <Card title={t('services.servicesRealized')} size="small" style={{ marginBottom: 16 }}>
              <Table
                dataSource={services}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: t('services.service'),
                    key: 'service',
                    render: (_: any, record: ServiceItem) => {
                      const service = serviceCategories?.find((s) => s.service_id === record.service_id);
                      return service?.service_name || '-';
                    },
                  },
                  {
                    title: t('services.quantity'),
                    dataIndex: 'service_qtd',
                    align: 'center' as const,
                    width: 100,
                  },
                  {
                    title: t('services.unitPrice'),
                    key: 'unit_price',
                    align: 'right' as const,
                    width: 120,
                    render: (_: any, record: ServiceItem) => {
                      const service = serviceCategories?.find((s) => s.service_id === record.service_id);
                      const price = record.unit_price !== undefined ? record.unit_price : (service ? Number(service.service_cost) : 0);
                      return formatCurrency(price);
                    },
                  },
                  {
                    title: t('services.subtotal'),
                    key: 'subtotal',
                    align: 'right' as const,
                    width: 120,
                    render: (_: any, record: ServiceItem) => {
                      const service = serviceCategories?.find((s) => s.service_id === record.service_id);
                      const price = record.unit_price !== undefined ? record.unit_price : (service ? Number(service.service_cost) : 0);
                      return formatCurrency(price * record.service_qtd);
                    },
                  },
                ]}
              />
            </Card>
          )}

          {products.length > 0 && (
            <Card title={t('services.productsSold')} size="small" style={{ marginBottom: 16 }}>
              <Table
                dataSource={products}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: t('services.product'),
                    key: 'product',
                    render: (_: any, record: ProductItem) => {
                      const product = productsData?.find((p) => p.product_id === record.product_id);
                      return product?.product_name || '-';
                    },
                  },
                  {
                    title: t('services.quantity'),
                    dataIndex: 'product_qtd',
                    align: 'center' as const,
                    width: 100,
                  },
                  {
                    title: t('products.unitPrice'),
                    key: 'unit_price',
                    align: 'right' as const,
                    width: 120,
                    render: (_: any, record: ProductItem) => {
                      const product = productsData?.find((p) => p.product_id === record.product_id);
                      const price = record.unit_price !== undefined ? record.unit_price : (product ? product.sell_price : 0);
                      return formatCurrency(price);
                    },
                  },
                  {
                    title: t('services.subtotal'),
                    key: 'subtotal',
                    align: 'right' as const,
                    width: 120,
                    render: (_: any, record: ProductItem) => {
                      const product = productsData?.find((p) => p.product_id === record.product_id);
                      const price = record.unit_price !== undefined ? record.unit_price : (product ? product.sell_price : 0);
                      return formatCurrency(price * record.product_qtd);
                    },
                  },
                ]}
              />
            </Card>
          )}

          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Text>{t('services.servicesTotal')}:</Text>
                  <Text strong>{formatCurrency(servicesTotal)}</Text>
                </Row>
                <Row justify="space-between">
                  <Text>{t('services.productsTotal')}:</Text>
                  <Text strong>{formatCurrency(productsTotal)}</Text>
                </Row>
                <Row justify="space-between">
                  <Text strong>{t('services.subtotal')}:</Text>
                  <Text strong>{formatCurrency(subtotal)}</Text>
                </Row>
                {applyDiscount && discountValue > 0 && (
                  <Row justify="space-between">
                    <Text type="danger">{t('services.discountValue')}:</Text>
                    <Text type="danger" strong>
                      - {formatCurrency(discountValue)}
                    </Text>
                  </Row>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between">
                  <Text strong style={{ fontSize: 18 }}>
                    {t('services.grandTotal')}:
                  </Text>
                  <Text strong style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>
                    {formatCurrency(grandTotal)}
                  </Text>
                </Row>
              </Space>
            </Space>
          </Card>
        </div>
      </div>
    </>
  );
}
