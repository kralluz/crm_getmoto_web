import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDate, parseDecimal } from '../format.util';
import { generatePdf } from '../pdf.util';
import type { ServiceOrder } from '../../types/service-order';

/**
 * Interface para dados do relatório consolidado
 */
export interface ConsolidatedServicesReportData {
  serviceOrders: ServiceOrder[];
  startDate?: string;
  endDate?: string;
}

/**
 * Calcula totais de uma OS
 */
function calculateOrderTotals(order: ServiceOrder) {
  const productsTotal = (order.service_products || []).reduce((sum, sp) => {
    const qty = parseDecimal(sp.product_qtd);
    const price = parseDecimal(sp.products.sell_price);
    return sum + qty * price;
  }, 0);

  const servicesTotal = (order.services_realized || []).reduce((sum, sr) => {
    const qty = parseDecimal(sr.service_qtd);
    const cost = parseDecimal(sr.service.service_cost);
    return sum + qty * cost;
  }, 0);

  const laborCost = parseDecimal(order.estimated_labor_cost || 0);

  return {
    productsTotal,
    servicesTotal,
    laborCost,
    total: productsTotal + servicesTotal + laborCost,
  };
}

/**
 * Cria seção de resumo executivo
 */
function createExecutiveSummary(
  orders: ServiceOrder[],
  startDate?: string,
  endDate?: string
): Content {
  const totalOrders = orders.length;
  const ordersByStatus = {
    draft: orders.filter((o) => o.status === 'draft').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, order) => {
    return sum + calculateOrderTotals(order).total;
  }, 0);

  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const periodText = startDate && endDate
    ? `Período: ${formatDate(startDate)} até ${formatDate(endDate)}`
    : startDate
    ? `A partir de: ${formatDate(startDate)}`
    : endDate
    ? `Até: ${formatDate(endDate)}`
    : 'Todos os períodos';

  return [
    { text: 'Resumo Executivo', style: 'subheader' },
    { text: periodText, style: 'info', italics: true, margin: [0, 0, 0, 10] as [number, number, number, number] },
    {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'Total de OS', style: 'tableHeader', alignment: 'center' },
            { text: 'OS Concluídas', style: 'tableHeader', alignment: 'center' },
            { text: 'Receita Total', style: 'tableHeader', alignment: 'center' },
            { text: 'Ticket Médio', style: 'tableHeader', alignment: 'center' },
          ],
          [
            { text: totalOrders.toString(), style: 'tableCell', alignment: 'center', fontSize: 14, bold: true },
            {
              text: completedOrders.length.toString(),
              style: 'tableCell',
              alignment: 'center',
              fontSize: 14,
              bold: true,
              color: '#52c41a',
            },
            {
              text: formatCurrency(totalRevenue),
              style: 'tableCell',
              alignment: 'center',
              fontSize: 14,
              bold: true,
              color: '#1890ff',
            },
            {
              text: formatCurrency(avgTicket),
              style: 'tableCell',
              alignment: 'center',
              fontSize: 14,
              bold: true,
            },
          ],
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#1890ff' : '#f0f0f0'),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#d9d9d9',
        vLineColor: () => '#d9d9d9',
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    } as any,
    {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'Status das Ordens de Serviço', style: 'tableHeader', alignment: 'center', colSpan: 4 },
            {},
            {},
            {},
          ],
          [
            { text: 'Rascunho', style: 'tableCell', alignment: 'center' },
            { text: 'Em Andamento', style: 'tableCell', alignment: 'center' },
            { text: 'Concluída', style: 'tableCell', alignment: 'center' },
            { text: 'Cancelada', style: 'tableCell', alignment: 'center' },
          ],
          [
            { text: ordersByStatus.draft.toString(), style: 'tableCell', alignment: 'center', fontSize: 12 },
            { text: ordersByStatus.in_progress.toString(), style: 'tableCell', alignment: 'center', fontSize: 12, color: '#ff9800' },
            { text: ordersByStatus.completed.toString(), style: 'tableCell', alignment: 'center', fontSize: 12, color: '#52c41a' },
            { text: ordersByStatus.cancelled.toString(), style: 'tableCell', alignment: 'center', fontSize: 12, color: '#ff4d4f' },
          ],
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#1890ff';
          if (rowIndex === 1) return '#e6f7ff';
          return null;
        },
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
 * Cria seção de lista de ordens de serviço
 */
function createOrdersListSection(orders: ServiceOrder[]): Content {
  if (orders.length === 0) {
    return [
      { text: 'Ordens de Serviço', style: 'subheader' },
      {
        text: 'Nenhuma ordem de serviço encontrada no período selecionado.',
        style: 'info',
        italics: true,
        color: '#8c8c8c',
        alignment: 'center',
        margin: [0, 20, 0, 20] as [number, number, number, number],
      },
    ];
  }

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  };

  const statusColors: Record<string, string> = {
    draft: '#8c8c8c',
    in_progress: '#ff9800',
    completed: '#52c41a',
    cancelled: '#ff4d4f',
  };

  const rows = orders.map((order) => {
    const totals = calculateOrderTotals(order);
    const statusText = statusLabels[order.status] || order.status;
    const statusColor = statusColors[order.status] || '#000000';

    return [
      { text: `#${order.service_order_id}`, style: 'tableCell', alignment: 'center', fontSize: 9 },
      { text: formatDate(order.created_at), style: 'tableCell', alignment: 'center', fontSize: 8 },
      { text: order.customer_name || '-', style: 'tableCell', fontSize: 9 },
      {
        text: order.vehicles ? `${order.vehicles.brand} ${order.vehicles.model}` : '-',
        style: 'tableCell',
        fontSize: 8,
      },
      {
        text: statusText,
        style: 'tableCell',
        alignment: 'center',
        color: statusColor,
        bold: true,
        fontSize: 8,
      },
      {
        text: formatCurrency(totals.total),
        style: 'tableCell',
        alignment: 'right',
        fontSize: 9,
        bold: order.status === 'completed',
      },
    ];
  });

  return [
    { text: 'Ordens de Serviço', style: 'subheader' },
    {
      text: `Total: ${orders.length} ordem(ns) de serviço`,
      style: 'info',
      italics: true,
      margin: [0, 0, 0, 10] as [number, number, number, number],
    },
    {
      table: {
        headerRows: 1,
        widths: ['8%', '12%', '*', '20%', '12%', '15%'],
        body: [
          [
            { text: 'OS #', style: 'tableHeader', fontSize: 9 },
            { text: 'Data', style: 'tableHeader', fontSize: 9 },
            { text: 'Cliente', style: 'tableHeader', fontSize: 9 },
            { text: 'Veículo', style: 'tableHeader', fontSize: 9 },
            { text: 'Status', style: 'tableHeader', fontSize: 9 },
            { text: 'Valor Total', style: 'tableHeader', fontSize: 9 },
          ],
          ...rows,
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#1890ff';
          if (rowIndex % 2 === 0) return '#f0f0f0';
          return null;
        },
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#d9d9d9',
        vLineColor: () => '#d9d9d9',
      },
    } as any,
  ];
}

/**
 * Cria seção de análise financeira detalhada
 */
function createFinancialAnalysis(orders: ServiceOrder[]): Content {
  const completedOrders = orders.filter((o) => o.status === 'completed');

  if (completedOrders.length === 0) {
    return [
      { text: 'Análise Financeira', style: 'subheader' },
      {
        text: 'Não há ordens concluídas no período para análise financeira.',
        style: 'info',
        italics: true,
        color: '#8c8c8c',
        alignment: 'center',
        margin: [0, 20, 0, 20] as [number, number, number, number],
      },
    ];
  }

  let totalProducts = 0;
  let totalServices = 0;
  let totalLabor = 0;

  completedOrders.forEach((order) => {
    const totals = calculateOrderTotals(order);
    totalProducts += totals.productsTotal;
    totalServices += totals.servicesTotal;
    totalLabor += totals.laborCost;
  });

  const grandTotal = totalProducts + totalServices + totalLabor;

  return [
    { text: 'Análise Financeira (Ordens Concluídas)', style: 'subheader' },
    {
      table: {
        widths: ['*', '30%'],
        body: [
          [
            { text: 'Receita com Produtos:', style: 'label', alignment: 'right' },
            { text: formatCurrency(totalProducts), style: 'value', alignment: 'right', bold: true },
          ],
          [
            { text: 'Receita com Serviços:', style: 'label', alignment: 'right' },
            { text: formatCurrency(totalServices), style: 'value', alignment: 'right', bold: true },
          ],
          [
            { text: 'Receita com Mão de Obra:', style: 'label', alignment: 'right' },
            { text: formatCurrency(totalLabor), style: 'value', alignment: 'right', bold: true },
          ],
          [
            {
              text: 'RECEITA TOTAL:',
              style: 'totalLabel',
              alignment: 'right',
              fillColor: '#e6f7ff',
              fontSize: 12,
            },
            {
              text: formatCurrency(grandTotal),
              style: 'totalValue',
              alignment: 'right',
              fillColor: '#e6f7ff',
              color: '#1890ff',
              bold: true,
              fontSize: 14,
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
      margin: [0, 0, 0, 15] as [number, number, number, number],
    } as any,
  ];
}

/**
 * Gera o relatório consolidado de OS por período em PDF
 */
export function generateConsolidatedServicesReport(data: ConsolidatedServicesReportData): void {
  const { serviceOrders, startDate, endDate } = data;

  const content: Content = [
    ...(createExecutiveSummary(serviceOrders, startDate, endDate) as any[]),
    ...(createFinancialAnalysis(serviceOrders) as any[]),
    ...(createOrdersListSection(serviceOrders) as any[]),
  ];

  const periodSuffix = startDate && endDate
    ? `${startDate.split('T')[0]}_${endDate.split('T')[0]}`
    : startDate
    ? `desde_${startDate.split('T')[0]}`
    : endDate
    ? `ate_${endDate.split('T')[0]}`
    : 'completo';

  generatePdf(content, `relatorio_consolidado_${periodSuffix}_${new Date().getTime()}.pdf`, {
    header: {
      title: 'Relatório Consolidado - Ordens de Serviço',
      subtitle: `${serviceOrders.length} ordem(ns) de serviço analisada(s)`,
    },
    info: {
      title: 'Relatório Consolidado - Ordens de Serviço',
      subject: 'Análise Consolidada de OS - CRM GetMoto',
      keywords: 'ordens de serviço, consolidado, análise, período',
    },
    pageOrientation: 'landscape',
  });
}
