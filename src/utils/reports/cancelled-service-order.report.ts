import type { Content } from 'pdfmake/interfaces';
import type { ServiceOrder } from '../../types/service-order';
import { formatCurrency, formatDate, formatDateTime, parseDecimal } from '../format.util';
import { defaultDocumentConfig, defaultStyles, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

/**
 * Calcula totais da ordem de serviço cancelada
 */
function calculateTotals(serviceOrder: ServiceOrder) {
  const productsTotal =
    serviceOrder.service_products?.reduce((sum, product) => {
      const qty = parseDecimal(product.product_qtd);
      const price = parseDecimal(product.unit_price);
      return sum + qty * price;
    }, 0) || 0;

  const servicesTotal =
    serviceOrder.services_realized?.reduce((sum, service) => {
      const qty = parseDecimal(service.service_qtd);
      const cost = parseDecimal(service.unit_price);
      return sum + qty * cost;
    }, 0) || 0;

  const subtotal = productsTotal + servicesTotal;

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
 * Cria header com logo e marca d'água CANCELLED
 */
function createCancelledHeader(logoBase64: string): Content {
  return {
    stack: [
      {
        columns: [
          {
            image: logoBase64,
            width: 120,
            margin: [0, 0, 0, 10] as [number, number, number, number],
          },
          {
            stack: [
              { text: COMPANY_INFO.name, fontSize: 16, bold: true, alignment: 'right' },
              { text: COMPANY_INFO.address.street, fontSize: 10, alignment: 'right' },
              { text: `${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.postcode}`, fontSize: 10, alignment: 'right' },
              { text: COMPANY_INFO.contact.phone, fontSize: 10, alignment: 'right' },
              { text: COMPANY_INFO.contact.email, fontSize: 10, alignment: 'right', color: '#0066cc' },
            ],
            width: '*',
          },
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },
      // Marca d'água CANCELLED bem visível
      {
        text: 'CANCELLED',
        fontSize: 50,
        bold: true,
        color: '#ff4d4f',
        alignment: 'center',
        margin: [0, 10, 0, 10] as [number, number, number, number],
        decoration: 'lineThrough',
        decorationStyle: 'double',
        decorationColor: '#ff4d4f',
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 2,
            lineColor: '#ff4d4f',
          },
        ],
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
    ],
  };
}

/**
 * Cria seção de informações de cancelamento
 */
function createCancellationInfo(serviceOrder: ServiceOrder): Content {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            stack: [
              {
                text: 'CANCELLATION INFORMATION',
                style: 'sectionTitle',
                color: '#ff4d4f',
                alignment: 'center',
                margin: [0, 0, 0, 5] as [number, number, number, number],
              },
              {
                columns: [
                  {
                    width: '30%',
                    text: 'Cancelled Date:',
                    bold: true,
                    color: '#ff4d4f',
                  },
                  {
                    width: '*',
                    text: serviceOrder.cancelled_at ? formatDateTime(serviceOrder.cancelled_at) : 'N/A',
                    color: '#ff4d4f',
                  },
                ],
                margin: [10, 5, 10, 5] as [number, number, number, number],
              },
              {
                columns: [
                  {
                    width: '30%',
                    text: 'Cancellation Reason:',
                    bold: true,
                    color: '#ff4d4f',
                  },
                  {
                    width: '*',
                    text: serviceOrder.cancellation_reason || 'Not provided',
                    color: '#ff4d4f',
                  },
                ],
                margin: [10, 5, 10, 5] as [number, number, number, number],
              },
            ],
            margin: [10, 10, 10, 10] as [number, number, number, number],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 2,
      vLineWidth: () => 2,
      hLineColor: () => '#ff4d4f',
      vLineColor: () => '#ff4d4f',
      fillColor: () => '#fff1f0',
    },
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria seção de informações do cliente e veículo
 */
function createCustomerVehicleSection(serviceOrder: ServiceOrder): Content {
  const vehicle = serviceOrder.vehicles;

  return {
    columns: [
      // Cliente
      {
        width: '48%',
        stack: [
          { text: 'CUSTOMER', style: 'sectionTitle', margin: [0, 0, 0, 5] as [number, number, number, number] },
          {
            table: {
              widths: ['*'],
              body: [
                [{ text: serviceOrder.customer_name || 'N/A', style: 'value', margin: [10, 5, 10, 5] as [number, number, number, number] }],
              ],
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#000000',
              vLineColor: () => '#000000',
            },
          },
        ],
      },
      { width: '4%', text: '' },
      // Veículo
      {
        width: '48%',
        stack: [
          { text: 'VEHICLE', style: 'sectionTitle', margin: [0, 0, 0, 5] as [number, number, number, number] },
          {
            table: {
              widths: ['40%', '*'],
              body: [
                [
                  { text: 'Registration:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
                  { text: vehicle?.plate || 'N/A', style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
                ],
                [
                  { text: 'Make:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
                  { text: vehicle?.brand || 'N/A', style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
                ],
                [
                  { text: 'Model:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
                  { text: vehicle?.model || 'N/A', style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
                ],
                [
                  { text: 'Year:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
                  { text: vehicle?.year?.toString() || 'N/A', style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
                ],
                [
                  { text: 'Mileage:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
                  { text: serviceOrder.vehicle_mile ? `${serviceOrder.vehicle_mile.toLocaleString('en-GB')} miles` : 'N/A', style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#000000',
              vLineColor: () => '#000000',
            },
          },
        ],
      },
    ],
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria seção de detalhes da ordem
 */
function createOrderDetails(serviceOrder: ServiceOrder): Content {
  return {
    table: {
      widths: ['25%', '*'],
      body: [
        [
          { text: 'Order Number:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
          { text: `#${serviceOrder.service_order_id.toString().padStart(4, '0')}`, style: 'value', bold: true, margin: [5, 3, 5, 3] as [number, number, number, number] },
        ],
        [
          { text: 'Created Date:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
          { text: formatDateTime(serviceOrder.created_at), style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
        ],
        [
          { text: 'Professional:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
          { text: serviceOrder.professional_name || 'N/A', style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
        ],
        [
          { text: 'Description:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
          { text: serviceOrder.service_description || 'N/A', style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
        ],
        ...(serviceOrder.notes
          ? [
              [
                { text: 'Notes:', style: 'label', margin: [5, 3, 5, 3] as [number, number, number, number] },
                { text: serviceOrder.notes, style: 'value', margin: [5, 3, 5, 3] as [number, number, number, number] },
              ],
            ]
          : []),
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
    },
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria tabela de itens (produtos e serviços) com marca de cancelado
 */
function createItemsTable(serviceOrder: ServiceOrder): Content {
  const rows: any[] = [];

  // Adicionar produtos
  if (serviceOrder.service_products && serviceOrder.service_products.length > 0) {
    serviceOrder.service_products.forEach((product) => {
      const qty = parseDecimal(product.product_qtd);
      const price = parseDecimal(product.unit_price);
      const total = qty * price;

      rows.push([
        { text: product.products.product_name, style: 'tableCell', color: '#999' },
        { text: qty.toFixed(2), style: 'tableCell', alignment: 'center', color: '#999' },
        { text: formatCurrency(price), style: 'tableCell', alignment: 'right', color: '#999' },
        { text: formatCurrency(total), style: 'tableCell', alignment: 'right', color: '#999' },
      ]);
    });
  }

  // Adicionar serviços
  if (serviceOrder.services_realized && serviceOrder.services_realized.length > 0) {
    serviceOrder.services_realized.forEach((service) => {
      const qty = parseDecimal(service.service_qtd);
      const cost = parseDecimal(service.unit_price);
      const total = qty * cost;

      rows.push([
        { text: service.service.service_name, style: 'tableCell', color: '#999' },
        { text: qty.toFixed(0), style: 'tableCell', alignment: 'center', color: '#999' },
        { text: formatCurrency(cost), style: 'tableCell', alignment: 'right', color: '#999' },
        { text: formatCurrency(total), style: 'tableCell', alignment: 'right', color: '#999' },
      ]);
    });
  }

  if (rows.length === 0) {
    rows.push([
      { text: 'No items', colSpan: 4, style: 'tableCell', alignment: 'center', color: '#999' },
      {},
      {},
      {},
    ]);
  }

  return {
    stack: [
      { text: 'ITEMS (CANCELLED - NOT CHARGED)', style: 'sectionTitle', color: '#ff4d4f', margin: [0, 0, 0, 10] as [number, number, number, number] },
      {
        table: {
          headerRows: 1,
          widths: ['*', '12%', '20%', '20%'],
          body: [
            [
              { text: 'Description', style: 'tableHeader', alignment: 'left', margin: [5, 5, 5, 5] as [number, number, number, number] },
              { text: 'Qty', style: 'tableHeader', alignment: 'center', margin: [5, 5, 5, 5] as [number, number, number, number] },
              { text: 'Unit Price', style: 'tableHeader', alignment: 'right', margin: [5, 5, 5, 5] as [number, number, number, number] },
              { text: 'Amount', style: 'tableHeader', alignment: 'right', margin: [5, 5, 5, 5] as [number, number, number, number] },
            ],
            ...rows,
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f5f5f5' : null),
        },
      },
    ],
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria caixa de total com indicação de cancelamento
 */
function createTotalsBox(serviceOrder: ServiceOrder, totals: ReturnType<typeof calculateTotals>): Content {
  const rows: any[] = [];

  // Subtotal
  rows.push([
    { text: 'Subtotal', style: 'label', alignment: 'right', margin: [10, 5, 5, 5] as [number, number, number, number], color: '#999' },
    { text: formatCurrency(totals.subtotal), style: 'value', alignment: 'right', margin: [5, 5, 10, 5] as [number, number, number, number], color: '#999', decoration: 'lineThrough' },
  ]);

  // Desconto (se houver)
  if (totals.discountValue > 0) {
    let discountLabel = 'Discount';
    if (serviceOrder.discount_percent) {
      discountLabel = `Discount (${parseDecimal(serviceOrder.discount_percent).toFixed(2)}%)`;
    }
    rows.push([
      { text: discountLabel, style: 'label', alignment: 'right', margin: [10, 5, 5, 5] as [number, number, number, number], color: '#999' },
      { text: `- ${formatCurrency(totals.discountValue)}`, style: 'value', alignment: 'right', margin: [5, 5, 10, 5] as [number, number, number, number], color: '#999', decoration: 'lineThrough' },
    ]);
  }

  // Total
  rows.push([
    { text: 'Total (CANCELLED)', style: 'totalLabel', alignment: 'right', margin: [10, 5, 5, 5] as [number, number, number, number], color: '#ff4d4f' },
    { text: formatCurrency(0), style: 'totalValue', alignment: 'right', margin: [5, 5, 10, 5] as [number, number, number, number], color: '#ff4d4f', fontSize: 18, bold: true },
  ]);

  return {
    columns: [
      { text: '', width: '*' },
      {
        width: 'auto',
        table: {
          widths: [120, 100],
          body: rows,
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#ff4d4f',
          vLineColor: () => '#ff4d4f',
          fillColor: () => '#fff1f0',
        },
      },
    ],
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Gera o relatório de Ordem de Serviço CANCELADA em PDF
 */
export async function generateCancelledServiceOrderReport(serviceOrder: ServiceOrder): Promise<void> {
  const totals = calculateTotals(serviceOrder);
  const logoBase64 = await loadLogoAsBase64();

  const content: Content = [
    createCancelledHeader(logoBase64),
    createCancellationInfo(serviceOrder),
    createOrderDetails(serviceOrder),
    createCustomerVehicleSection(serviceOrder),
    createItemsTable(serviceOrder),
    createTotalsBox(serviceOrder, totals),
    // Aviso final
    {
      text: 'This order was cancelled and no charges were applied. This document is for reference only.',
      fontSize: 10,
      italics: true,
      color: '#666',
      alignment: 'center',
      margin: [0, 20, 0, 0] as [number, number, number, number],
    },
  ];

  const docDefinition: any = {
    ...defaultDocumentConfig,
    pageOrientation: 'portrait',
    content,
    styles: {
      ...defaultStyles,
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#000000',
        margin: [0, 5, 0, 5] as [number, number, number, number],
      },
    },
    watermark: {
      text: 'CANCELLED',
      color: '#ff4d4f',
      opacity: 0.1,
      bold: true,
      italics: false,
      fontSize: 80,
      angle: -45,
    },
    footer: (currentPage: number, pageCount: number) => {
      return {
        columns: [
          {
            text: `Cancelled Service Order #${serviceOrder.service_order_id}`,
            fontSize: 9,
            color: '#666',
            margin: [40, 0, 0, 0] as [number, number, number, number],
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            fontSize: 9,
            alignment: 'right',
            color: '#666',
            margin: [0, 0, 40, 0] as [number, number, number, number],
          },
        ],
        margin: [0, 10, 0, 10] as [number, number, number, number],
      };
    },
  };

  pdfMake.createPdf(docDefinition).download(`Cancelled_Service_Order_${serviceOrder.service_order_id}_${formatDate(new Date().toISOString())}.pdf`);
}
