import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDate, parseDecimal } from '../format.util';
import { defaultDocumentConfig, defaultStyles, createGetMotoHeader, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import type { ServiceOrder } from '../../types/service-order';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

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
    ? `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`
    : startDate
    ? `From: ${formatDate(startDate)}`
    : endDate
    ? `Until: ${formatDate(endDate)}`
    : 'All periods';

  return [
    { text: 'Executive Summary', style: 'subheader' },
    { text: periodText, style: 'info', margin: [0, 0, 0, 10] as [number, number, number, number] },
    {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'Total SO', style: 'tableHeader', alignment: 'center', border: [true, true, true, true] },
            { text: 'Completed SO', style: 'tableHeader', alignment: 'center', border: [true, true, true, true] },
            { text: 'Total Revenue', style: 'tableHeader', alignment: 'center', border: [true, true, true, true] },
            { text: 'Average Ticket', style: 'tableHeader', alignment: 'center', border: [true, true, true, true] },
          ],
          [
            { text: totalOrders.toString(), style: 'tableCell', alignment: 'center', fontSize: 14, bold: true, border: [true, true, true, true] },
            { text: completedOrders.length.toString(), style: 'tableCell', alignment: 'center', fontSize: 14, bold: true, border: [true, true, true, true] },
            { text: formatCurrency(totalRevenue), style: 'tableCell', alignment: 'center', fontSize: 14, bold: true, border: [true, true, true, true] },
            { text: formatCurrency(avgTicket), style: 'tableCell', alignment: 'center', fontSize: 14, bold: true, border: [true, true, true, true] },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
    {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'Draft', style: 'tableHeader', alignment: 'center', border: [true, true, true, true] },
            { text: 'In Progress', style: 'tableHeader', alignment: 'center', border: [true, true, true, true] },
            { text: 'Completed', style: 'tableHeader', alignment: 'center', border: [true, true, true, true] },
            { text: 'Cancelled', style: 'tableHeader', alignment: 'center', border: [true, true, true, true] },
          ],
          [
            { text: ordersByStatus.draft.toString(), style: 'tableCell', alignment: 'center', fontSize: 12, border: [true, true, true, true] },
            { text: ordersByStatus.in_progress.toString(), style: 'tableCell', alignment: 'center', fontSize: 12, border: [true, true, true, true] },
            { text: ordersByStatus.completed.toString(), style: 'tableCell', alignment: 'center', fontSize: 12, border: [true, true, true, true] },
            { text: ordersByStatus.cancelled.toString(), style: 'tableCell', alignment: 'center', fontSize: 12, border: [true, true, true, true] },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

/**
 * Cria seção de lista de ordens de serviço
 */
function createOrdersListSection(orders: ServiceOrder[]): Content {
  if (orders.length === 0) {
    return [
      { text: 'Service Orders', style: 'subheader' },
      {
        text: 'No service orders found in the selected period.',
        style: 'info',
        alignment: 'center',
        margin: [0, 20, 0, 20] as [number, number, number, number],
      },
    ];
  }

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const rows = orders.map((order) => {
    const totals = calculateOrderTotals(order);
    const statusText = statusLabels[order.status] || order.status;

    return [
      { text: `#${order.service_order_id}`, style: 'tableCell', alignment: 'center', fontSize: 9, border: [true, true, true, true] },
      { text: formatDate(order.created_at), style: 'tableCell', alignment: 'center', fontSize: 8, border: [true, true, true, true] },
      { text: order.customer_name || '-', style: 'tableCell', fontSize: 9, border: [true, true, true, true] },
      {
        text: order.vehicles ? `${order.vehicles.brand} ${order.vehicles.model}` : '-',
        style: 'tableCell',
        fontSize: 8,
        border: [true, true, true, true],
      },
      {
        text: statusText,
        style: 'tableCell',
        alignment: 'center',
        fontSize: 8,
        border: [true, true, true, true],
      },
      {
        text: formatCurrency(totals.total),
        style: 'tableCell',
        alignment: 'right',
        fontSize: 9,
        bold: order.status === 'completed',
        border: [true, true, true, true],
      },
    ];
  });

  return [
    { text: 'Service Orders', style: 'subheader' },
    {
      text: `Total: ${orders.length} service order(s)`,
      style: 'info',
      margin: [0, 0, 0, 10] as [number, number, number, number],
    },
    // @ts-expect-error - pdfmake type compatibility issue
    {
      table: {
        headerRows: 1,
        widths: ['8%', '12%', '*', '20%', '12%', '15%'],
        body: [
          [
            { text: 'SO #', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: 'Date', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: 'Customer', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: 'Vehicle', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: 'Status', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: 'Total Value', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
          ],
          ...rows,
        ],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
      },
    },
  ];
}

/**
 * Cria seção de análise financeira detalhada
 */
function createFinancialAnalysis(orders: ServiceOrder[]): Content {
  const completedOrders = orders.filter((o) => o.status === 'completed');

  if (completedOrders.length === 0) {
    return [
      { text: 'Financial Analysis', style: 'subheader' },
      {
        text: 'No completed orders in the period for financial analysis.',
        style: 'info',
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
    { text: 'Financial Analysis (Completed Orders)', style: 'subheader' },
    {
      table: {
        widths: ['*', '30%'],
        body: [
          [
            { text: 'Revenue from Products:', style: 'label', alignment: 'right', border: [true, true, true, true] },
            { text: formatCurrency(totalProducts), style: 'value', alignment: 'right', bold: true, border: [true, true, true, true] },
          ],
          [
            { text: 'Revenue from Services:', style: 'label', alignment: 'right', border: [true, true, true, true] },
            { text: formatCurrency(totalServices), style: 'value', alignment: 'right', bold: true, border: [true, true, true, true] },
          ],
          [
            { text: 'Revenue from Labor:', style: 'label', alignment: 'right', border: [true, true, true, true] },
            { text: formatCurrency(totalLabor), style: 'value', alignment: 'right', bold: true, border: [true, true, true, true] },
          ],
          [
            {
              text: 'TOTAL REVENUE:',
              style: 'totalLabel',
              alignment: 'right',
              fontSize: 12,
              border: [true, true, true, true],
            },
            {
              text: formatCurrency(grandTotal),
              style: 'totalValue',
              alignment: 'right',
              bold: true,
              fontSize: 14,
              border: [true, true, true, true],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
      },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

/**
 * Gera o relatório consolidado de OS por período em PDF
 */
export async function generateConsolidatedServicesReport(data: ConsolidatedServicesReportData): Promise<void> {
  const { serviceOrders, startDate, endDate } = data;

  // Carregar logo
  const logoBase64 = await loadLogoAsBase64();

  const content: Content = [
    createGetMotoHeader(logoBase64),
    { text: 'Consolidated Service Orders Report', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] as [number, number, number, number] },
    ...(createExecutiveSummary(serviceOrders, startDate, endDate) as any[]),
    ...(createFinancialAnalysis(serviceOrders) as any[]),
    ...(createOrdersListSection(serviceOrders) as any[]),
  ];

  // Adicionar rodapé como parte do conteúdo
  content.push({
    table: {
      widths: ['*'],
      body: [
        [
          {
            columns: [
              {
                text: 'If you have any questions concerning this report, Please contact us.',
                fontSize: 8,
                width: '*',
              },
              {
                text: '                    ',
                fontSize: 8,
                width: 'auto',
              },
              {
                text: 'Thank you for your business!',
                fontSize: 8,
                width: 'auto',
              },
            ],
            margin: [4, 4, 4, 4] as [number, number, number, number],
          },
        ],
        [
          {
            text: `Company Registration No. ${COMPANY_INFO.registration.number}`,
            alignment: 'center',
            bold: true,
            fontSize: 8,
            margin: [4, 4, 4, 4] as [number, number, number, number],
          },
        ],
        [
          {
            text: `Bank Details. ${COMPANY_INFO.bank.name} Sort Code ${COMPANY_INFO.bank.sortCode}. Account No ${COMPANY_INFO.bank.accountNo}`,
            alignment: 'center',
            fontSize: 8,
            margin: [4, 4, 4, 4] as [number, number, number, number],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
    margin: [0, 0, 0, 10] as [number, number, number, number],
  });

  // Data do relatório
  const reportDate = formatDate(new Date());
  content.push({
    columns: [
      {
        text: `REPORT DATE ${reportDate}`,
        bold: true,
        fontSize: 9,
        width: '100%',
        alignment: 'center',
      },
    ],
    margin: [0, 0, 0, 0] as [number, number, number, number],
  });

  const periodSuffix = startDate && endDate
    ? `${startDate.split('T')[0]}_${endDate.split('T')[0]}`
    : startDate
    ? `from_${startDate.split('T')[0]}`
    : endDate
    ? `until_${endDate.split('T')[0]}`
    : 'complete';

  const docDefinition: any = {
    ...defaultDocumentConfig,
    pageOrientation: 'portrait',
    content,
    styles: defaultStyles,
    background: (currentPage: number, pageSize: any) => {
      return {
        canvas: [
          // Borda esquerda
          {
            type: 'line',
            x1: 40,
            y1: 40,
            x2: 40,
            y2: pageSize.height - 40,
            lineWidth: 1,
            lineColor: '#000000',
          },
          // Borda direita
          {
            type: 'line',
            x1: pageSize.width - 40,
            y1: 40,
            x2: pageSize.width - 40,
            y2: pageSize.height - 40,
            lineWidth: 1,
            lineColor: '#000000',
          },
          // Borda superior
          {
            type: 'line',
            x1: 40,
            y1: 40,
            x2: pageSize.width - 40,
            y2: 40,
            lineWidth: 1,
            lineColor: '#000000',
          },
          // Borda inferior
          {
            type: 'line',
            x1: 40,
            y1: pageSize.height - 40,
            x2: pageSize.width - 40,
            y2: pageSize.height - 40,
            lineWidth: 1,
            lineColor: '#000000',
          },
        ],
      };
    },
    info: {
      title: 'Consolidated Service Orders Report',
      author: COMPANY_INFO.name,
      subject: 'Consolidated Analysis - GetMoto',
      keywords: 'service orders, consolidated, analysis, period',
      creator: COMPANY_INFO.name,
      producer: 'pdfmake',
    },
  };

  pdfMake.createPdf(docDefinition).download(`consolidated_report_${periodSuffix}_${new Date().getTime()}.pdf`);
}
