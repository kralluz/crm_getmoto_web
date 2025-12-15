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
import { useVehicle, useUpdateVehicle } from '../../hooks/useMotorcycles';
// Removed large inline step JSX; now contained in ServiceOrderSteps component
import { ServiceOrderSteps } from './ServiceOrderSteps';
import type { CreateServiceOrderData, UpdateServiceOrderData } from '../../types/service-order';
import { useFormat } from '../../hooks/useFormat';

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
  const { formatCurrency } = useFormat();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const { mutate: updateVehicle } = useUpdateVehicle();

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

  // Atualizar campo de quilometragem quando veículo for alterado
  useEffect(() => {
    if (selectedVehicle && !isEditing) {
      form.setFieldValue('vehicle_mile', selectedVehicle.mile || 0);
    }
  }, [selectedVehicle, form, isEditing]);

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
    let calculatedDiscount = 0;
    if (discountType === 'percent') {
      calculatedDiscount = subtotal * (discountPercent / 100);
    } else {
      calculatedDiscount = discountAmount;
    }
    // VALIDAÇÃO: Desconto nunca pode ser maior que o subtotal
    return Math.min(calculatedDiscount, subtotal);
  }, [applyDiscount, subtotal, discountType, discountPercent, discountAmount]);

  // Calcular total geral (com desconto)
  const grandTotal = useMemo(() => {
    // Garantir que o total nunca seja negativo
    return Math.max(0, subtotal - discountValue);
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      console.log('🔍 Form values from validateFields:', values);
      console.log('📦 Products state:', products);
      console.log('🔧 Services state:', services);
      console.log('💰 Discount - apply:', applyDiscount, 'type:', discountType, 'percent:', discountPercent, 'amount:', discountAmount);

      // VALIDAÇÃO CRÍTICA: Desconto não pode exceder o subtotal
      if (applyDiscount) {
        let calculatedDiscount = 0;
        if (discountType === 'percent') {
          if (discountPercent > 100) {
            NotificationService.error('Desconto em percentual não pode ser maior que 100%');
            return;
          }
          calculatedDiscount = subtotal * (discountPercent / 100);
        } else {
          calculatedDiscount = discountAmount;
        }
        
        if (calculatedDiscount > subtotal) {
          NotificationService.error(
            'Desconto Inválido',
            `O desconto não pode ser maior que o valor total da ordem (${formatCurrency(subtotal)})`
          );
          return;
        }
        
        if (calculatedDiscount < 0) {
          NotificationService.error('O desconto não pode ser negativo');
          return;
        }
      }

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
        vehicle_mile: values.vehicle_mile,
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

      // Atualizar quilometragem do veículo se fornecida e diferente da atual
      if (!isEditing && values.vehicle_mile !== undefined && selectedVehicle) {
        const currentMile = selectedVehicle.mile || 0;
        const newMile = values.vehicle_mile;

        if (newMile !== currentMile && newMile > currentMile) {
          console.log(`🚗 Atualizando quilometragem do veículo ${values.vehicle_id}: ${currentMile}miles -> ${newMile}miles`);
          try {
            await new Promise<void>((resolve, reject) => {
              updateVehicle(
                { id: values.vehicle_id, data: { mile: newMile } },
                {
                  onSuccess: () => {
                    console.log('✅ Quilometragem atualizada com sucesso');
                    resolve();
                  },
                  onError: (error) => {
                    console.error('❌ Erro ao atualizar quilometragem:', error);
                    reject(error);
                  },
                }
              );
            });
          } catch (error) {
            console.error('❌ Falha ao atualizar quilometragem do veículo:', error);
            NotificationService.warning('Ordem de serviço será criada, mas não foi possível atualizar a quilometragem do veículo.');
          }
        }
      }

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
      
      // Se for erro de validação do Ant Design (frontend)
      if (error?.errorFields) {
        NotificationService.warning(t('services.fillRequiredFields'));
        return;
      }
      
      // Se for erro de validação da API (backend)
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors)) {
        console.log('📋 API validation errors:', apiErrors);
        
        // Mapear erros da API para os campos do formulário
        const fieldErrors = apiErrors.map((err: any) => ({
          name: err.field,
          errors: [err.message],
        }));
        
        // Aplicar os erros no formulário
        form.setFields(fieldErrors);
        
        // Mostrar notificação com resumo dos erros
        const errorMessages = apiErrors.map((err: any) => err.message).join('; ');
        NotificationService.error(
          error?.response?.data?.message || 'Erro de validação',
          errorMessages
        );
        
        // Se estiver em etapas avançadas e o erro for em campo da primeira etapa, voltar
        const firstStepFields = ['vehicle_id', 'customer_name', 'vehicle_mile'];
        const hasFirstStepError = apiErrors.some((err: any) => 
          firstStepFields.includes(err.field)
        );
        if (hasFirstStepError && currentStep > 0) {
          setCurrentStep(0);
        }
        
        // Se erro em professional_name ou service_description, ir para etapa final
        const finalStepFields = ['professional_name', 'service_description', 'notes'];
        const hasFinalStepError = apiErrors.some((err: any) => 
          finalStepFields.includes(err.field)
        );
        if (hasFinalStepError && currentStep !== 3) {
          setCurrentStep(3);
        }
      } else {
        // Erro genérico
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
        
        // Validar campos obrigatórios
        await form.validateFields(['vehicle_id', 'customer_name']);
        
        // Se houver veículo selecionado, validar também o vehicle_mile
        const vehicleId = form.getFieldValue('vehicle_id');
        if (vehicleId && selectedVehicle) {
          try {
            await form.validateFields(['vehicle_mile']);
            
            // Verificar explicitamente se o valor não é negativo
            const milValue = form.getFieldValue('vehicle_mile');
            const minMile = selectedVehicle.mile || 0;
            
            if (milValue !== null && milValue !== undefined) {
              if (milValue < 0) {
                return;
              }
              if (milValue < minMile) {
                return;
              }
            }
          } catch (error) {
            console.error('❌ Vehicle mile validation failed:', error);
            return;
          }
        }
        
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
      
      // Validar campos do step 3 (detalhes da ordem)
      if (currentStep === 3) {
        console.log('Validating step 3 fields...');
        await form.validateFields(['professional_name']);
        console.log('✅ Step 3 validation passed');
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
      title: isMobile ? t('services.vehicle') : t('services.vehicleStep'),
    },
    {
      title: isMobile ? t('services.services') : t('services.servicesStep'),
    },
    {
      title: isMobile ? t('services.products') : t('services.productsStep'),
    },
    {
      title: isMobile ? t('services.finalization') : t('services.finalizationStep'),
    },
    {
      title: isMobile ? t('services.confirm') : t('services.confirmationStep'),
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
            size="small"
            className="compact-steps"
            responsive={false}
            style={{ marginBottom: 16 }}
          />
          <Divider style={{ margin: '12px 0' }} />
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
        />
      </Form>
    </Modal>
  );
}
