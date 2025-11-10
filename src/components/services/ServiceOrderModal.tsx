import { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Steps, Divider, Space, Button } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { NotificationService } from '../../services/notification.service';
import {
  useCreateServiceOrder,
  // useUpdateServiceOrder, // REMOVIDO: Service orders são imutáveis
  useServiceOrder,
} from '../../hooks/useServices';
// import { useCustomers } from '../../hooks/useCustomers'; // REMOVIDO: tabela customers não existe
import { useServiceCategories } from '../../hooks/useServiceCategories';
import { useProducts } from '../../hooks/useProducts';
import { useVehicle } from '../../hooks/useMotorcycles';
// Removed large inline step JSX; now contained in ServiceOrderSteps component
import { generateBudgetPDF } from '../../utils/reports/service-order.report';
import { ServiceOrderSteps } from './ServiceOrderSteps';
import type { CreateServiceOrderData, UpdateServiceOrderData } from '../../types/service-order';

// Typography, Input and related components now only used inside ServiceOrderSteps

interface ServiceOrderModalProps {
  open: boolean;
  serviceOrderId?: number;
  onClose: () => void;
}

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

export function ServiceOrderModal({
  open,
  serviceOrderId,
  onClose,
}: ServiceOrderModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const isEditing = !!serviceOrderId;

  // Hooks para dados
  const { data: serviceOrder } = useServiceOrder(isEditing ? serviceOrderId : 0);
  // const { data: customers } = useCustomers(); // REMOVIDO: tabela customers não existe
  const { data: serviceCategories } = useServiceCategories({ is_active: true });
  const { data: productsData } = useProducts();
  const selectedVehicleId = Form.useWatch('vehicle_id', form);
  const { data: selectedVehicle } = useVehicle(selectedVehicleId);

  // Mutations
  const createMutation = useCreateServiceOrder();
  // const updateMutation = useUpdateServiceOrder(); // REMOVIDO: Service orders são imutáveis

  const isSaving = createMutation.isPending; // || updateMutation.isPending;

  // Opções de autocomplete para clientes - REMOVIDO: tabela customers não existe
  // customer_name é apenas uma string, não há autocomplete

  // Opções de status
  // statusOptions consumed only within editing step which now lives inside ServiceOrderSteps

  // Carregar dados do formulário quando editing
  useEffect(() => {
    if (isEditing && serviceOrder) {
      form.setFieldsValue({
        professional_name: serviceOrder.professional_name,
        vehicle_id: serviceOrder.vehicle_id,
        customer_name: serviceOrder.customer_name,
        service_description: serviceOrder.service_description,
        status: serviceOrder.status,
        notes: serviceOrder.notes,
        finalized_at: serviceOrder.finalized_at
          ? dayjs(serviceOrder.finalized_at)
          : undefined,
      });
      // Pular para o step de edição
      setCurrentStep(3);
    }
  }, [isEditing, serviceOrder, form]);

  // Reset only when modal closes, not when it opens
  useEffect(() => {
    if (!open) {
      console.log('🔄 Modal closed - scheduling reset in 200ms');
      // Delay reset to avoid clearing during close animation
      const timer = setTimeout(() => {
        console.log('🧹 Resetting form and state');
        form.resetFields();
        setCurrentStep(0);
        setProducts([]);
        setServices([]);
        setApplyDiscount(false);
        setDiscountType('percent');
        setDiscountPercent(0);
        setDiscountAmount(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, form]);

  // Debug: Monitor products and services state changes
  useEffect(() => {
    console.log('📊 Products state changed:', products);
  }, [products]);

  useEffect(() => {
    console.log('📊 Services state changed:', services);
  }, [services]);

  // Adicionar produto
  const handleAddProduct = () => {
    console.log('➕ handleAddProduct called - current products:', products);
    const newProduct = {
      key: `product-${Date.now()}`,
      product_qtd: 1,
    };
    const updatedProducts = [...products, newProduct];
    console.log('➕ Setting products to:', updatedProducts);
    setProducts(updatedProducts);
  };

  // Remover produto
  const handleRemoveProduct = (key: string) => {
    setProducts(products.filter((p) => p.key !== key));
  };

  // Atualizar produto
  const handleProductChange = (key: string, field: keyof ProductItem, value: any) => {
    console.log(`🔄 handleProductChange - key: ${key}, field: ${field}, value:`, value);
    setProducts((prevProducts) => {
      const updatedProducts = prevProducts.map((p) => 
        p.key === key ? { ...p, [field]: value } : p
      );
      console.log('🔄 Updated products:', updatedProducts);
      return updatedProducts;
    });
  };

  // Adicionar serviço
  const handleAddService = () => {
    console.log('➕ handleAddService called - current services:', services);
    const newService = {
      key: `service-${Date.now()}`,
      service_qtd: 1,
    };
    const updatedServices = [...services, newService];
    console.log('➕ Setting services to:', updatedServices);
    setServices(updatedServices);
  };

  // Remover serviço
  const handleRemoveService = (key: string) => {
    setServices(services.filter((s) => s.key !== key));
  };

  // Atualizar serviço
  const handleServiceChange = (key: string, field: keyof ServiceItem, value: any) => {
    console.log(`🔄 handleServiceChange - key: ${key}, field: ${field}, value:`, value);
    setServices((prevServices) => {
      const updatedServices = prevServices.map((s) => 
        s.key === key ? { ...s, [field]: value } : s
      );
      console.log('🔄 Updated services:', updatedServices);
      return updatedServices;
    });
  };

  // Calcular total de produtos (inclui itens sem product_id se o usuário informou preço manual)
  const productsTotal = useMemo(() => {
    console.log('🔄 Recalculando productsTotal (nova lógica)...');
    const total = products.reduce((sum, item) => {
      // Busca do produto para preço padrão (se houver ID)
      const product = item.product_id
        ? productsData?.find((p) => p.product_id === item.product_id)
        : undefined;
      const fallbackPrice = product?.sell_price ?? 0;
      const unitPrice = item.unit_price !== undefined && item.unit_price !== null
        ? item.unit_price
        : fallbackPrice;
      const qtd = item.product_qtd || 0;
      const itemTotal = unitPrice * qtd;
      return sum + itemTotal;
    }, 0);
    console.log('💵 TOTAL DE PRODUTOS (incluindo itens sem ID):', total);
    return total;
  }, [products, productsData]);

  // Calcular total de serviços (inclui itens sem service_id se o usuário informou preço manual)
  const servicesTotal = useMemo(() => {
    console.log('🔄 Recalculando servicesTotal (nova lógica)...');
    const total = services.reduce((sum, item) => {
      const service = item.service_id
        ? serviceCategories?.find((s) => s.service_id === item.service_id)
        : undefined;
      const fallbackPrice = service ? Number(service.service_cost) || 0 : 0;
      const unitPrice = item.unit_price !== undefined && item.unit_price !== null
        ? item.unit_price
        : fallbackPrice;
      const qtd = item.service_qtd || 0;
      const itemTotal = unitPrice * qtd;
      return sum + itemTotal;
    }, 0);
    console.log('💵 TOTAL DE SERVIÇOS (incluindo itens sem ID):', total);
    return total;
  }, [services, serviceCategories]);

  // Calcular subtotal (sem desconto)
  const subtotal = useMemo(() => {
    return productsTotal + servicesTotal;
  }, [productsTotal, servicesTotal]);

  // Calcular valor do desconto
  const discountValue = useMemo(() => {
    if (!applyDiscount) return 0;
    if (discountType === 'percent') {
      return subtotal * (discountPercent / 100);
    }
    return discountAmount;
  }, [applyDiscount, subtotal, discountType, discountPercent, discountAmount]);

  // Calcular total geral (com desconto)
  const grandTotal = useMemo(() => {
    return subtotal - discountValue;
  }, [subtotal, discountValue]);

  // Verificar se há produtos com estoque insuficiente ou esgotado
  const hasInsufficientStock = useMemo(() => {
    if (isEditing) return false;
    
    return products.some((p) => {
      if (!p.product_id) return false;
      const productData = productsData?.find((pd) => pd.product_id === p.product_id);
      if (!productData) return false;
      const availableStock = Number(productData.quantity);
      // Bloqueia se: quantidade solicitada > disponível OU estoque zerado (mesmo com qtd=1)
      return p.product_qtd > availableStock || availableStock === 0;
    });
  }, [products, productsData, isEditing]);

  // Função para gerar PDF do orçamento
  const handleGeneratePDF = () => {
    try {
      const formValues = form.getFieldsValue();
      
      // Buscar informações do veículo
      let vehicleInfo = '';
      if (selectedVehicle) {
        vehicleInfo = `${selectedVehicle.plate} - ${selectedVehicle.brand} ${selectedVehicle.model}${selectedVehicle.year ? ` (${selectedVehicle.year})` : ''}${selectedVehicle.color ? ` - ${selectedVehicle.color}` : ''}`;
      }
      
      // Preparar dados dos serviços (inclui itens sem ID, usando nome genérico)
      const servicesData = services.map((s, idx) => {
        const serviceData = s.service_id
          ? serviceCategories?.find(sc => sc.service_id === s.service_id)
          : undefined;
        const unitPrice = s.unit_price !== undefined
          ? s.unit_price
          : (serviceData ? Number(serviceData.service_cost) : 0);
        return {
          service_name: serviceData?.service_name || `Serviço ${idx + 1}`,
          service_qtd: s.service_qtd,
          unit_price: unitPrice,
        };
      });
      
      // Preparar dados dos produtos (inclui itens sem ID, usando nome genérico)
      const productsDataPDF = products.map((p, idx) => {
        const productData = p.product_id
          ? productsData?.find(pd => pd.product_id === p.product_id)
          : undefined;
        const unitPrice = p.unit_price !== undefined
          ? p.unit_price
          : (productData ? productData.sell_price : 0);
        return {
          product_name: productData?.product_name || `Produto ${idx + 1}`,
          product_qtd: p.product_qtd,
          unit_price: unitPrice,
        };
      });
      
      generateBudgetPDF(
        {
          customer_name: formValues.customer_name || 'Cliente não informado',
          vehicle_info: vehicleInfo,
          professional_name: formValues.professional_name,
          service_description: formValues.service_description,
          notes: formValues.notes,
          services: servicesData,
          products: productsDataPDF,
          discount_percent: applyDiscount && discountType === 'percent' ? discountPercent : undefined,
          discount_amount: applyDiscount && discountType === 'amount' ? discountAmount : undefined,
        },
        t
      );
      
      NotificationService.success(t('services.pdfGeneratedSuccess'));
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      NotificationService.error(t('services.pdfGenerationError'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      console.log('🔍 Form values from validateFields:', values);
      console.log('📦 Products state:', products);
      console.log('🔧 Services state:', services);
      console.log('💰 Discount - apply:', applyDiscount, 'type:', discountType, 'percent:', discountPercent, 'amount:', discountAmount);

      // Filtrar produtos e serviços válidos
      const validProducts = products
        .filter((p) => p.product_id)
        .map((p) => ({
          product_id: p.product_id!,
          product_qtd: p.product_qtd,
          ...(p.unit_price !== undefined && { unit_price: p.unit_price }),
        }));
      
      const validServices = services
        .filter((s) => s.service_id)
        .map((s) => ({
          service_id: s.service_id!,
          service_qtd: s.service_qtd,
          ...(s.unit_price !== undefined && { unit_price: s.unit_price }),
        }));

      console.log('✅ Valid products to send:', validProducts.length, validProducts);
      console.log('✅ Valid services to send:', validServices.length, validServices);

      // Validação final: ordem de serviço DEVE ter pelo menos um produto OU serviço
      if (!isEditing && validProducts.length === 0 && validServices.length === 0) {
        NotificationService.error('Uma ordem de serviço deve ter pelo menos um produto OU um serviço');
        console.error('❌ Cannot create service order without products or services');
        return;
      }

      // Validação de estoque insuficiente
      if (!isEditing && validProducts.length > 0) {
        const insufficientStockProducts = validProducts.filter((p) => {
          const productData = productsData?.find((pd) => pd.product_id === p.product_id);
          if (!productData) return false;
          return p.product_qtd > Number(productData.quantity);
        });

        if (insufficientStockProducts.length > 0) {
          const productNames = insufficientStockProducts.map((p) => {
            const productData = productsData?.find((pd) => pd.product_id === p.product_id);
            return `${productData?.product_name} (solicitado: ${p.product_qtd}, disponível: ${productData?.quantity})`;
          }).join(', ');
          
          NotificationService.error(
            'Estoque Insuficiente',
            `Os seguintes produtos não têm estoque suficiente: ${productNames}`
          );
          console.error('❌ Insufficient stock for products:', insufficientStockProducts);
          return;
        }
      }

      // Preparar dados para submissão
      const formData: CreateServiceOrderData | UpdateServiceOrderData = {
        professional_name: values.professional_name,
        vehicle_id: values.vehicle_id,
        customer_name: values.customer_name,
        service_description: values.service_description,
        status: values.status || 'completed',
        notes: values.notes,
        finalized_at: values.finalized_at
          ? values.finalized_at.toISOString()
          : null,
        // Incluir desconto se aplicado
        ...(applyDiscount && discountType === 'percent' && { discount_percent: discountPercent }),
        ...(applyDiscount && discountType === 'amount' && { discount_amount: discountAmount }),
        // Incluir produtos e serviços (sempre para criação)
        ...(!isEditing && {
          products: validProducts,
          services: validServices,
        }),
      };
      
      console.log('📤 Data being sent to API:', JSON.stringify(formData, null, 2));

      if (isEditing) {
        // NOTA: Service orders são imutáveis e não podem ser editados
        // Para alterar uma ordem, deve-se cancelá-la e criar uma nova
        NotificationService.error('Service orders cannot be edited. Please cancel and create a new one.');
        return;
        // await updateMutation.mutateAsync({
        //   id: serviceOrderId!,
        //   data: formData,
        // });
        // NotificationService.success(t('services.orderUpdatedSuccess'));
      } else {
        await createMutation.mutateAsync(formData);
        NotificationService.success(t('services.orderCreatedSuccess'));
      }

      onClose();
    } catch (error: any) {
      console.error('❌ Error submitting form:', error);
      if (error?.errorFields) {
        NotificationService.warning(t('services.fillRequiredFields'));
      } else {
        NotificationService.error(
          error?.response?.data?.message || t('services.orderSaveError')
        );
      }
    }
  };

  const handleNextStep = async () => {
    try {
      console.log('🔄 handleNextStep - currentStep:', currentStep, 'isEditing:', isEditing);
      console.log('📦 Products:', products);
      console.log('🔧 Services:', services);
      
      // Validar campos do step atual
      if (currentStep === 0) {
        console.log('Validating step 0 fields...');
        await form.validateFields(['vehicle_id', 'customer_name']);
        console.log('✅ Step 0 validation passed');
      }
      
      // Validar que há pelo menos um produto OU serviço ao sair do step de produtos (step 2)
      if (currentStep === 2 && !isEditing) {
        const validProducts = products.filter((p) => p.product_id);
        const validServices = services.filter((s) => s.service_id);
        
        console.log('✅ Valid products:', validProducts.length, validProducts);
        console.log('✅ Valid services:', validServices.length, validServices);
        
        if (validProducts.length === 0 && validServices.length === 0) {
          console.log('❌ Validation failed: no products or services');
          NotificationService.error('Uma ordem de serviço deve ter pelo menos um produto OU um serviço');
          return;
        }
        
        console.log('✅ Validation passed, moving to next step');
      }
      
      console.log('✅ Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } catch (error: unknown) {
      console.error('❌ Error in handleNextStep:', error);
      NotificationService.warning(t('services.fillRequiredFields'));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: t('services.vehicleStep'),
      description: t('services.vehicleStepDescription'),
    },
    {
      title: t('services.servicesStep'),
      description: t('services.servicesStepDescription'),
    },
    {
      title: t('services.productsStep'),
      description: t('services.productsStepDescription'),
    },
    {
      title: t('services.finalizationStep'),
      description: t('services.finalizationStepDescription'),
    },
    {
      title: t('services.confirmationStep'),
      description: t('services.confirmationStepDescription'),
    },
  ];

  // Step content moved to ServiceOrderSteps component

  const modalFooter = (
    <Space>
      {currentStep > 0 && !isEditing && (
        <Button onClick={handlePrevStep} icon={<ArrowLeftOutlined />}>
          {t('services.previous')}
        </Button>
      )}
      <Button onClick={onClose}>{t('common.cancel')}</Button>
      {currentStep < 4 && !isEditing ? (
        <Button
          type="primary"
          onClick={handleNextStep}
          icon={<ArrowRightOutlined />}
          disabled={currentStep === 2 && hasInsufficientStock}
        >
          {t('services.next')}
        </Button>
      ) : (
        <Button 
          type="primary" 
          onClick={handleSubmit} 
          loading={isSaving}
          disabled={hasInsufficientStock}
        >
          {isEditing ? t('services.updateOrder') : t('services.createOrder')}
        </Button>
      )}
    </Space>
  );

  return (
    <Modal
      title={isEditing ? t('services.editOrder') : t('services.newOrder')}
      open={open}
      onCancel={onClose}
      footer={modalFooter}
      width={900}
      maskClosable={false}
    >
      {!isEditing && (
        <>
          <Steps
            current={currentStep}
            items={steps}
            style={{ marginBottom: 24 }}
          />
          <Divider />
        </>
      )}

      <Form
        form={form}
        layout="vertical"
        preserve
        initialValues={{ status: 'completed' }}
      >
        <ServiceOrderSteps
          currentStep={currentStep}
          isEditing={isEditing}
          form={form}
          services={services}
          products={products}
          serviceCategories={serviceCategories}
          productsData={productsData}
          servicesTotal={servicesTotal}
          productsTotal={productsTotal}
          subtotal={subtotal}
          discountValue={discountValue}
          grandTotal={grandTotal}
          applyDiscount={applyDiscount}
          discountType={discountType}
          discountPercent={discountPercent}
          discountAmount={discountAmount}
          setApplyDiscount={setApplyDiscount}
          setDiscountType={setDiscountType}
          setDiscountPercent={setDiscountPercent}
          setDiscountAmount={setDiscountAmount}
          selectedVehicle={selectedVehicle}
          handleAddService={handleAddService}
          handleRemoveService={handleRemoveService}
          handleServiceChange={handleServiceChange}
          handleAddProduct={handleAddProduct}
          handleRemoveProduct={handleRemoveProduct}
          handleProductChange={handleProductChange}
          handleGeneratePDF={handleGeneratePDF}
        />
      </Form>
    </Modal>
  );
}
