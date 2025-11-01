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
      const price = parseDecimal(product.products.sell_price);
      return sum + qty * price;
    }, 0) || 0;

  const servicesTotal =
    serviceOrder.services_realized?.reduce((sum, service) => {
      const qty = parseDecimal(service.service_qtd);
      const cost = parseDecimal(service.service.service_cost);
      return sum + qty * cost;
    }, 0) || 0;

  const laborTotal = parseDecimal(serviceOrder.estimated_labor_cost || 0);
  const total = productsTotal + servicesTotal + laborTotal;

  return { productsTotal, servicesTotal, laborTotal, total };
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

  if (serviceOrder.diagnosis) {
    content.push({ text: 'Diagnóstico', style: 'subheader' });
    content.push({
      text: serviceOrder.diagnosis,
      style: 'info',
      margin: [0, 0, 0, 10] as [number, number, number, number],
    });
  }

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
    const price = parseDecimal(product.products.sell_price);
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
    const cost = parseDecimal(service.service.service_cost);
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

  return [
    { text: 'Resumo Financeiro', style: 'subheader' },
    {
      table: {
        widths: ['*', '30%'],
        body: [
          [
            { text: 'Total de Produtos:', style: 'label', alignment: 'right' },
            { text: formatCurrency(totals.productsTotal), style: 'value', alignment: 'right' },
          ],
          [
            { text: 'Total de Serviços:', style: 'label', alignment: 'right' },
            { text: formatCurrency(totals.servicesTotal), style: 'value', alignment: 'right' },
          ],
          [
            { text: 'Mão de Obra:', style: 'label', alignment: 'right' },
            { text: formatCurrency(totals.laborTotal), style: 'value', alignment: 'right' },
          ],
          [
            { text: 'TOTAL GERAL:', style: 'totalLabel', alignment: 'right', fillColor: '#f0f0f0' },
            {
              text: formatCurrency(totals.total),
              style: 'totalValue',
              alignment: 'right',
              fillColor: '#f0f0f0',
              bold: true,
            },
          ],
        ],
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
