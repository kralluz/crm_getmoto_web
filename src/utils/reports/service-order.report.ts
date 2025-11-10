import type { Content } from 'pdfmake/interfaces';
import type { ServiceOrder } from '../../types/service-order';
import { formatCurrency, formatDateTime, parseDecimal } from '../format.util';
import { generatePdf } from '../pdf.util';

/**
 * Labels de status traduzidos
 */
const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

/**
 * Calcula totais da ordem de serviço
 */
function calculateTotals(serviceOrder: ServiceOrder) {
  const productsTotal =
    serviceOrder.service_products?.reduce((sum, product) => {
      const qty = parseDecimal(product.product_qtd);
      // Usar unit_price se disponível, senão sell_price
      const price = (product as any).unit_price !== undefined 
        ? parseDecimal((product as any).unit_price)
        : parseDecimal(product.products.sell_price);
      return sum + qty * price;
    }, 0) || 0;

  const servicesTotal =
    serviceOrder.services_realized?.reduce((sum, service) => {
      const qty = parseDecimal(service.service_qtd);
      // Usar unit_price se disponível, senão service_cost
      const cost = (service as any).unit_price !== undefined
        ? parseDecimal((service as any).unit_price)
        : parseDecimal(service.service.service_cost);
      return sum + qty * cost;
    }, 0) || 0;

  const subtotal = productsTotal + servicesTotal;
  
  // Calcular desconto
  let discountValue = 0;
  if (serviceOrder.discount_amount) {
    discountValue = parseDecimal(serviceOrder.discount_amount);
  } else if (serviceOrder.discount_percent) {
    discountValue = subtotal * (parseDecimal(serviceOrder.discount_percent) / 100);
  }
  
  const total = subtotal - discountValue;

  return { productsTotal, servicesTotal, subtotal, discountValue, total };
}

/**
 * Cria seção de informações básicas da OS
 */
function createInfoSection(serviceOrder: ServiceOrder): Content {
  return [
    { text: 'Informações da Ordem de Serviço', style: 'subheader' },
    {
      table: {
        widths: ['25%', '75%'],
        body: [
          [
            { text: 'Número da OS:', style: 'label' },
            { text: `#${serviceOrder.service_order_id}`, style: 'value' },
          ],
          [
            { text: 'Data de Criação:', style: 'label' },
            { text: formatDateTime(serviceOrder.created_at), style: 'value' },
          ],
          [
            { text: 'Status:', style: 'label' },
            { text: STATUS_LABELS[serviceOrder.status] || serviceOrder.status, style: 'value' },
          ],
          [
            { text: 'Cliente:', style: 'label' },
            { text: serviceOrder.customer_name || '-', style: 'value' },
          ],
          [
            { text: 'Profissional:', style: 'label' },
            { text: serviceOrder.professional_name || '-', style: 'value' },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

/**
 * Cria seção de informações do veículo
 */
function createVehicleSection(serviceOrder: ServiceOrder): Content {
  if (!serviceOrder.vehicles) {
    return [];
  }

  const vehicle = serviceOrder.vehicles;
  return [
    { text: 'Informações do Veículo', style: 'subheader' },
    {
      table: {
        widths: ['25%', '75%'],
        body: [
          [{ text: 'Marca/Modelo:', style: 'label' }, { text: `${vehicle.brand} ${vehicle.model}`, style: 'value' }],
          [{ text: 'Placa:', style: 'label' }, { text: vehicle.plate, style: 'value' }],
          [{ text: 'Ano:', style: 'label' }, { text: vehicle.year?.toString() || '-', style: 'value' }],
          [{ text: 'Cor:', style: 'label' }, { text: vehicle.color || '-', style: 'value' }],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

/**
 * Cria seção de descrição e diagnóstico
 */
function createDescriptionSection(serviceOrder: ServiceOrder): Content {
  const content: Content[] = [];

  if (serviceOrder.service_description) {
    content.push({ text: 'Descrição do Serviço', style: 'subheader' });
    content.push({
      text: serviceOrder.service_description,
      style: 'info',
      margin: [0, 0, 0, 10] as [number, number, number, number],
    });
  }

  // Diagnosis field not yet in ServiceOrder type
  // if (serviceOrder.diagnosis) {
  //   content.push({ text: 'Diagnóstico', style: 'subheader' });
  //   content.push({
  //     text: serviceOrder.diagnosis,
  //     style: 'info',
  //     margin: [0, 0, 0, 10] as [number, number, number, number],
  //   });
  // }

  if (serviceOrder.notes) {
    content.push({ text: 'Observações', style: 'subheader' });
    content.push({
      text: serviceOrder.notes,
      style: 'info',
      margin: [0, 0, 0, 15] as [number, number, number, number],
    });
  }

  return content;
}

/**
 * Cria seção de produtos utilizados
 */
function createProductsSection(serviceOrder: ServiceOrder): Content {
  if (!serviceOrder.service_products || serviceOrder.service_products.length === 0) {
    return [];
  }

  const rows = serviceOrder.service_products.map((product) => {
    const qty = parseDecimal(product.product_qtd);
    // Usar unit_price se disponível, senão sell_price
    const price = (product as any).unit_price !== undefined
      ? parseDecimal((product as any).unit_price)
      : parseDecimal(product.products.sell_price);
    const total = qty * price;

    return [
      { text: product.products.product_name, style: 'tableCell' },
      { text: qty.toFixed(2), style: 'tableCell', alignment: 'center' },
      { text: formatCurrency(price), style: 'tableCell', alignment: 'right' },
      { text: formatCurrency(total), style: 'tableCell', alignment: 'right' },
    ];
  });

  return [
    { text: 'Produtos Utilizados', style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['*', '15%', '20%', '20%'],
        body: [
          [
            { text: 'Produto', style: 'tableHeader' },
            { text: 'Qtd', style: 'tableHeader' },
            { text: 'Preço Unit.', style: 'tableHeader' },
            { text: 'Total', style: 'tableHeader' },
          ],
          ...rows,
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#1890ff' : rowIndex % 2 === 0 ? '#f0f0f0' : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#d9d9d9',
        vLineColor: () => '#d9d9d9',
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    } as any,
  ];
}

/**
 * Cria seção de serviços realizados
 */
function createServicesSection(serviceOrder: ServiceOrder): Content {
  if (!serviceOrder.services_realized || serviceOrder.services_realized.length === 0) {
    return [];
  }

  const rows = serviceOrder.services_realized.map((service) => {
    const qty = parseDecimal(service.service_qtd);
    // Usar unit_price se disponível, senão service_cost
    const cost = (service as any).unit_price !== undefined
      ? parseDecimal((service as any).unit_price)
      : parseDecimal(service.service.service_cost);
    const total = qty * cost;

    return [
      { text: service.service.service_name, style: 'tableCell' },
      { text: qty.toFixed(0), style: 'tableCell', alignment: 'center' },
      { text: formatCurrency(cost), style: 'tableCell', alignment: 'right' },
      { text: formatCurrency(total), style: 'tableCell', alignment: 'right' },
    ];
  });

  return [
    { text: 'Serviços Realizados', style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['*', '15%', '20%', '20%'],
        body: [
          [
            { text: 'Serviço', style: 'tableHeader' },
            { text: 'Qtd', style: 'tableHeader' },
            { text: 'Preço Unit.', style: 'tableHeader' },
            { text: 'Total', style: 'tableHeader' },
          ],
          ...rows,
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#1890ff' : rowIndex % 2 === 0 ? '#f0f0f0' : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#d9d9d9',
        vLineColor: () => '#d9d9d9',
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    } as any,
  ];
}

/**
 * Cria seção de resumo financeiro
 */
function createFinancialSummary(serviceOrder: ServiceOrder): Content {
  const totals = calculateTotals(serviceOrder);
  
  const rows: any[] = [
    [
      { text: 'Total de Produtos:', style: 'label', alignment: 'right' },
      { text: formatCurrency(totals.productsTotal), style: 'value', alignment: 'right' },
    ],
    [
      { text: 'Total de Serviços:', style: 'label', alignment: 'right' },
      { text: formatCurrency(totals.servicesTotal), style: 'value', alignment: 'right' },
    ],
    [
      { text: 'SUBTOTAL:', style: 'label', alignment: 'right', bold: true },
      { text: formatCurrency(totals.subtotal), style: 'value', alignment: 'right', bold: true },
    ],
  ];
  
  // Adicionar linha de desconto se houver
  if (totals.discountValue > 0) {
    rows.push([
      { text: 'Desconto:', style: 'label', alignment: 'right', color: '#dc3545' },
      { text: `- ${formatCurrency(totals.discountValue)}`, style: 'value', alignment: 'right', color: '#dc3545' },
    ]);
  }
  
  rows.push([
    { text: 'TOTAL GERAL:', style: 'totalLabel', alignment: 'right', fillColor: '#f0f0f0' },
    {
      text: formatCurrency(totals.total),
      style: 'totalValue',
      alignment: 'right',
      fillColor: '#f0f0f0',
      bold: true,
    },
  ]);

  return [
    { text: 'Resumo Financeiro', style: 'subheader' },
    {
      table: {
        widths: ['*', '30%'],
        body: rows,
      },
      layout: {
        hLineWidth: (i: number, node: any) => (i === node.table.body.length - 1 ? 2 : 0.5),
        vLineWidth: () => 0.5,
        hLineColor: () => '#d9d9d9',
        vLineColor: () => '#d9d9d9',
      },
    } as any,
  ];
}

/**
 * Gera o relatório completo de Ordem de Serviço em PDF
 */
export function generateServiceOrderReport(serviceOrder: ServiceOrder): void {
  const content: Content = [
    ...(createInfoSection(serviceOrder) as any[]),
    ...(createVehicleSection(serviceOrder) as any[]),
    ...(createDescriptionSection(serviceOrder) as any[]),
    ...(createProductsSection(serviceOrder) as any[]),
    ...(createServicesSection(serviceOrder) as any[]),
    ...(createFinancialSummary(serviceOrder) as any[]),
  ];

  generatePdf(content, `os_${serviceOrder.service_order_id}.pdf`, {
    header: {
      title: `Ordem de Serviço #${serviceOrder.service_order_id}`,
      subtitle: STATUS_LABELS[serviceOrder.status] || serviceOrder.status,
    },
    info: {
      title: `Ordem de Serviço #${serviceOrder.service_order_id}`,
      subject: 'Ordem de Serviço - CRM GetMoto',
      keywords: 'ordem serviço, OS, moto, mecânica',
    },
  });
}

/**
 * Interface para dados de orçamento (antes de salvar a OS)
 */
export interface BudgetData {
  customer_name: string;
  vehicle_info?: string;
  professional_name?: string;
  service_description?: string;
  notes?: string;
  services: Array<{
    service_name: string;
    service_qtd: number;
    unit_price: number;
  }>;
  products: Array<{
    product_name: string;
    product_qtd: number;
    unit_price: number;
  }>;
  discount_percent?: number;
  discount_amount?: number;
}

/**
 * Gera PDF de orçamento (antes de criar a OS)
 */
export function generateBudgetPDF(data: BudgetData, t?: (key: string) => string): void {
  // Sanitize nome do cliente
  const customerName = data.customer_name && data.customer_name.trim() !== ''
    ? data.customer_name
    : 'Cliente não informado';

  // Calcular totais (tratando valores possivelmente NaN)
  const productsTotal = data.products.reduce((sum, p) => {
    const qty = Number(p.product_qtd) || 0;
    const price = Number(p.unit_price) || 0;
    return sum + qty * price;
  }, 0);
  const servicesTotal = data.services.reduce((sum, s) => {
    const qty = Number(s.service_qtd) || 0;
    const price = Number(s.unit_price) || 0;
    return sum + qty * price;
  }, 0);
  const subtotal = productsTotal + servicesTotal;
  
  let discountValue = 0;
  if (data.discount_amount) {
    discountValue = data.discount_amount;
  } else if (data.discount_percent) {
    discountValue = subtotal * (data.discount_percent / 100);
  }
  
  const total = subtotal - discountValue;

  const content: Content = [];

  // Informações básicas
  content.push({ text: t ? t('services.customerInfo') : 'Informações do Cliente', style: 'subheader' });
  content.push({
    table: {
      widths: ['25%', '75%'],
      body: [
        [
          { text: t ? t('services.customer') : 'Cliente:', style: 'label' },
          { text: customerName, style: 'value' },
        ],
        ...(data.vehicle_info
          ? [[{ text: t ? t('services.vehicle') : 'Veículo:', style: 'label' }, { text: data.vehicle_info, style: 'value' }]]
          : []),
        ...(data.professional_name
          ? [[{ text: t ? t('services.professional') : 'Profissional:', style: 'label' }, { text: data.professional_name, style: 'value' }]]
          : []),
      ],
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 15] as [number, number, number, number],
  });

  // Descrição
  if (data.service_description) {
    content.push({ text: t ? t('services.serviceDescription') : 'Descrição do Serviço', style: 'subheader' });
    content.push({
      text: data.service_description,
      style: 'info',
      margin: [0, 0, 0, 15] as [number, number, number, number],
    });
  }

  // Serviços
  if (data.services.length > 0) {
    content.push({ text: t ? t('services.services') : 'Serviços', style: 'subheader' });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '15%', '20%', '20%'],
        body: [
          [
            { text: t ? t('services.service') : 'Serviço', style: 'tableHeader' },
            { text: t ? t('services.quantity') : 'Qtd', style: 'tableHeader' },
            { text: t ? t('services.unitPrice') : 'Preço Unit.', style: 'tableHeader' },
            { text: t ? t('services.total') : 'Total', style: 'tableHeader' },
          ],
          ...data.services.map((s) => [
            { text: s.service_name, style: 'tableCell' },
            { text: s.service_qtd.toFixed(0), style: 'tableCell', alignment: 'center' },
            { text: formatCurrency(s.unit_price), style: 'tableCell', alignment: 'right' },
            { text: formatCurrency(s.service_qtd * s.unit_price), style: 'tableCell', alignment: 'right' },
          ]),
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#1890ff' : rowIndex % 2 === 0 ? '#f0f0f0' : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#d9d9d9',
        vLineColor: () => '#d9d9d9',
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    } as any);
  }

  // Produtos
  if (data.products.length > 0) {
    content.push({ text: t ? t('services.products') : 'Produtos', style: 'subheader' });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '15%', '20%', '20%'],
        body: [
          [
            { text: t ? t('services.product') : 'Produto', style: 'tableHeader' },
            { text: t ? t('services.quantity') : 'Qtd', style: 'tableHeader' },
            { text: t ? t('products.unitPrice') : 'Preço Unit.', style: 'tableHeader' },
            { text: t ? t('services.total') : 'Total', style: 'tableHeader' },
          ],
          ...data.products.map((p) => [
            { text: p.product_name, style: 'tableCell' },
            { text: p.product_qtd.toFixed(2), style: 'tableCell', alignment: 'center' },
            { text: formatCurrency(p.unit_price), style: 'tableCell', alignment: 'right' },
            { text: formatCurrency(p.product_qtd * p.unit_price), style: 'tableCell', alignment: 'right' },
          ]),
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#1890ff' : rowIndex % 2 === 0 ? '#f0f0f0' : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#d9d9d9',
        vLineColor: () => '#d9d9d9',
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    } as any);
  }

  // Resumo financeiro
  const summaryRows: any[] = [];
  
  if (data.services.length > 0) {
    summaryRows.push([
      { text: t ? t('services.servicesTotal') : 'Total de Serviços:', style: 'label', alignment: 'right' },
      { text: formatCurrency(servicesTotal), style: 'value', alignment: 'right' },
    ]);
  }
  
  if (data.products.length > 0) {
    summaryRows.push([
      { text: t ? t('services.productsTotal') : 'Total de Produtos:', style: 'label', alignment: 'right' },
      { text: formatCurrency(productsTotal), style: 'value', alignment: 'right' },
    ]);
  }
  
  summaryRows.push([
    { text: t ? t('services.subtotal').toUpperCase() : 'SUBTOTAL:', style: 'label', alignment: 'right', bold: true },
    { text: formatCurrency(subtotal), style: 'value', alignment: 'right', bold: true },
  ]);
  
  if (discountValue > 0) {
    summaryRows.push([
      { text: t ? t('services.discount') : 'Desconto:', style: 'label', alignment: 'right', color: '#dc3545' },
      { text: `- ${formatCurrency(discountValue)}`, style: 'value', alignment: 'right', color: '#dc3545' },
    ]);
  }
  
  summaryRows.push([
    { text: t ? t('services.grandTotal').toUpperCase() : 'TOTAL GERAL:', style: 'totalLabel', alignment: 'right', fillColor: '#f0f0f0' },
    {
      text: formatCurrency(total),
      style: 'totalValue',
      alignment: 'right',
      fillColor: '#f0f0f0',
      bold: true,
    },
  ]);

  content.push({ text: t ? t('services.financialSummary') : 'Resumo Financeiro', style: 'subheader' });
  content.push({
    table: {
      widths: ['*', '30%'],
      body: summaryRows,
    },
    layout: {
      hLineWidth: (i: number, node: any) => (i === node.table.body.length - 1 ? 2 : 0.5),
      vLineWidth: () => 0.5,
      hLineColor: () => '#d9d9d9',
      vLineColor: () => '#d9d9d9',
    },
  } as any);

  // Observações
  if (data.notes) {
    content.push({ text: t ? t('services.notes') : 'Observações', style: 'subheader' });
    content.push({
      text: data.notes,
      style: 'info',
      margin: [0, 0, 0, 15] as [number, number, number, number],
    });
  }

  const fileName = `${t ? t('services.budget').toLowerCase() : 'orcamento'}_${customerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  
  generatePdf(content, fileName, {
    header: {
      title: t ? t('services.budget').toUpperCase() : 'ORÇAMENTO',
      subtitle: customerName,
    },
    info: {
      title: `${t ? t('services.budget') : 'Orçamento'} - ${customerName}`,
      subject: 'Orçamento - CRM GetMoto',
      keywords: 'orçamento, estimativa, moto, mecânica',
    },
  });
}
