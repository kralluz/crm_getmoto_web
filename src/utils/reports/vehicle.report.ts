import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDate, parseDecimal } from '../format.util';
import { defaultDocumentConfig, defaultStyles, createGetMotoHeader, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

/**
 * Interface para dados do veículo
 */
interface Vehicle {
  vehicle_id: number;
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  mile?: number;
  created_at: string;
  service_order?: ServiceOrder[];
}

interface ServiceOrder {
  service_order_id: number;
  customer_name?: string;
  professional_name?: string;
  status: string;
  created_at: string;
  vehicle_mile?: number;
  service_products?: any[];
  services_realized?: any[];
  discount_percent?: number;
  discount_amount?: number;
  notes?: string;
}

interface VehicleStats {
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  averagePerOrder: number;
  lastServiceDate?: string;
}

/**
 * Labels de status traduzidos
 */
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Cria seção de informações do veículo
 */
function createVehicleInfoSection(vehicle: Vehicle): Content {
  return {
    table: {
      widths: ['35%', '*', '35%', '*'],
      body: [
        [
          { text: 'Registration', style: 'label', border: [true, true, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: vehicle.plate || 'N/A', style: 'value', border: [false, true, true, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: 'Make', style: 'label', border: [true, true, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: vehicle.brand || 'N/A', style: 'value', border: [false, true, true, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
        ],
        [
          { text: 'Model', style: 'label', border: [true, true, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: vehicle.model || 'N/A', style: 'value', border: [false, true, true, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: 'Year', style: 'label', border: [true, true, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: vehicle.year?.toString() || 'N/A', style: 'value', border: [false, true, true, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
        ],
        [
          { text: 'Color', style: 'label', border: [true, true, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: vehicle.color || 'N/A', style: 'value', border: [false, true, true, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: 'Odometer', style: 'label', border: [true, true, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: vehicle.mile ? `${vehicle.mile.toLocaleString()} miles` : 'N/A', style: 'value', border: [false, true, true, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#CCCCCC',
      vLineColor: () => '#CCCCCC',
    },
    margin: [0, 10, 0, 15] as [number, number, number, number],
  };
}

/**
 * Cria seção de estatísticas
 */
function createStatsSection(stats: VehicleStats): Content {
  return {
    columns: [
      {
        width: '25%',
        table: {
          widths: ['*'],
          body: [
            [{ text: 'Total Orders', style: 'statLabel', alignment: 'center', margin: [5, 5, 5, 2] as [number, number, number, number], border: [true, true, true, false] }],
            [{ text: stats.totalOrders.toString(), style: 'statValue', alignment: 'center', margin: [5, 2, 5, 5] as [number, number, number, number], border: [true, false, true, true] }],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#1890ff',
          vLineColor: () => '#1890ff',
        },
      },
      { width: 10, text: '' },
      {
        width: '25%',
        table: {
          widths: ['*'],
          body: [
            [{ text: 'Completed', style: 'statLabel', alignment: 'center', margin: [5, 5, 5, 2] as [number, number, number, number], border: [true, true, true, false] }],
            [{ text: stats.completedOrders.toString(), style: 'statValue', alignment: 'center', margin: [5, 2, 5, 5] as [number, number, number, number], border: [true, false, true, true] }],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#52c41a',
          vLineColor: () => '#52c41a',
        },
      },
      { width: 10, text: '' },
      {
        width: '*',
        table: {
          widths: ['*'],
          body: [
            [{ text: 'Total Spent', style: 'statLabel', alignment: 'center', margin: [5, 5, 5, 2] as [number, number, number, number], border: [true, true, true, false] }],
            [{ text: formatCurrency(stats.totalSpent), style: 'statValue', alignment: 'center', margin: [5, 2, 5, 5] as [number, number, number, number], border: [true, false, true, true] }],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#ff4d4f',
          vLineColor: () => '#ff4d4f',
        },
      },
    ],
    margin: [0, 10, 0, 15] as [number, number, number, number],
  };
}

/**
 * Calcula totais da ordem de serviço (igual à invoice)
 */
function calculateOrderTotals(serviceOrder: ServiceOrder) {
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
 * Cria tabela de itens para uma ordem (igual à invoice)
 */
function createOrderItemsTable(serviceOrder: ServiceOrder): Content {
  const rows: any[] = [];

  // Adicionar produtos
  if (serviceOrder.service_products && serviceOrder.service_products.length > 0) {
    serviceOrder.service_products.forEach((product) => {
      const qty = parseDecimal(product.product_qtd);
      const price = parseDecimal(product.unit_price);
      const total = qty * price;

      rows.push([
        { text: product.products?.product_name || product.product_name || 'Product', style: 'tableCell', border: [true, true, true, true] },
        { text: qty.toFixed(2), style: 'tableCell', alignment: 'center', border: [true, true, true, true] },
        { text: formatCurrency(price), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
        { text: formatCurrency(total), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
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
        { text: service.service?.service_name || service.service_name || 'Service', style: 'tableCell', border: [true, true, true, true] },
        { text: qty.toFixed(0), style: 'tableCell', alignment: 'center', border: [true, true, true, true] },
        { text: formatCurrency(cost), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
        { text: formatCurrency(total), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
      ]);
    });
  }

  return {
    table: {
      headerRows: 1,
      widths: ['*', '10%', '20%', '20%'],
      body: [
        [
          { text: 'Description', style: 'tableHeader', alignment: 'left', border: [true, true, true, true], margin: [5, 8, 5, 8] as [number, number, number, number] },
          { text: 'Qty', style: 'tableHeader', border: [false, true, false, true], margin: [5, 8, 5, 8] as [number, number, number, number] },
          { text: 'Unit Price', style: 'tableHeader', border: [false, true, false, true], margin: [5, 8, 5, 8] as [number, number, number, number] },
          { text: 'Amount', style: 'tableHeader', border: [true, true, true, true], margin: [5, 8, 5, 8] as [number, number, number, number] },
        ],
        ...rows,
      ],
    },
    layout: {
      hLineWidth: (i: number) => {
        if (i === 1) return 2;
        return 1;
      },
      vLineWidth: () => 1,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: (i: number) => (i === 0 ? 0 : 5),
      paddingBottom: (i: number) => (i === 0 ? 8 : 3),
    },
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria caixa de total com desconto (igual à invoice)
 */
function createOrderTotalsBox(serviceOrder: ServiceOrder, totals: ReturnType<typeof calculateOrderTotals>): Content {
  const rows: any[] = [];

  // Subtotal
  rows.push([
    { text: 'Subtotal', style: 'label', alignment: 'right', margin: [10, 5, 5, 5] as [number, number, number, number] },
    { text: formatCurrency(totals.subtotal), style: 'value', alignment: 'right', margin: [5, 5, 10, 5] as [number, number, number, number] },
  ]);

  // Desconto (se houver)
  if (totals.discountValue > 0) {
    let discountLabel = 'Discount';
    if (serviceOrder.discount_percent) {
      discountLabel = `Discount (${parseDecimal(serviceOrder.discount_percent).toFixed(2)}%)`;
    }
    rows.push([
      { text: discountLabel, style: 'label', alignment: 'right', margin: [10, 5, 5, 5] as [number, number, number, number], color: '#ff4d4f' },
      { text: `- ${formatCurrency(totals.discountValue)}`, style: 'value', alignment: 'right', margin: [5, 5, 10, 5] as [number, number, number, number], color: '#ff4d4f' },
    ]);
  }

  // Total
  rows.push([
    { text: 'Total', style: 'totalLabel', alignment: 'right', margin: [10, 5, 5, 5] as [number, number, number, number] },
    { text: formatCurrency(totals.total), style: 'totalValue', alignment: 'right', margin: [5, 5, 10, 5] as [number, number, number, number] },
  ]);

  return {
    columns: [
      { text: '', width: '*' },
      {
        width: 'auto',
        table: {
          widths: [80, 100],
          body: rows,
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000',
        },
      },
    ],
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria seção de cliente e veículo para cada ordem (IDÊNTICO à invoice)
 */
function createOrderCustomerVehicleSection(order: ServiceOrder, vehicle: Vehicle): Content {
  return {
    columns: [
      // Cliente (lado esquerdo)
      {
        width: '35%',
        table: {
          widths: ['*'],
          body: [
            [{ text: order.customer_name || 'N/A', style: 'label', alignment: 'center', margin: [10, 10, 10, 10] as [number, number, number, number] }],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000',
        },
      },
      { width: 15, text: '' },
      // Veículo (lado direito)
      {
        width: '*',
        table: {
          widths: ['35%', '*'],
          body: [
            [
              { text: 'Registration', style: 'label', border: [true, true, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: vehicle.plate || 'N/A', style: 'value', border: [false, true, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
            ],
            [
              { text: 'Make', style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: vehicle.brand || 'N/A', style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
            ],
            [
              { text: 'Model', style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: vehicle.model || 'N/A', style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
            ],
            [
              { text: 'Year', style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: vehicle.year?.toString() || 'N/A', style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
            ],
            [
              { text: 'Odometer / Mile', style: 'label', border: [true, false, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: order.vehicle_mile ? `${order.vehicle_mile.toLocaleString('en-GB')} miles` : 'N/A', style: 'value', border: [false, false, true, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
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
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria uma página de invoice completa para cada ordem (IDÊNTICO à invoice)
 */
function createOrderInvoicePage(order: ServiceOrder, vehicle: Vehicle, logoBase64: string): any {
  const totals = calculateOrderTotals(order);
  const invoiceDate = formatDate(order.created_at);

  const content: Content = [
    createGetMotoHeader(logoBase64),
    createOrderCustomerVehicleSection(order, vehicle),
    createOrderItemsTable(order),
  ];

  // Adicionar notes se existir
  if (order.notes && order.notes.trim() !== '') {
    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: order.notes,
              style: 'tableCell',
              alignment: 'left',
              margin: [5, 5, 5, 5] as [number, number, number, number],
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
      margin: [0, 0, 0, 20] as [number, number, number, number],
    });
  }

  content.push(createOrderTotalsBox(order, totals));

  return {
    content,
    invoiceDate,
    orderId: order.service_order_id,
  };
}

/**
 * Gera relatório em PDF do veículo (primeira página resumo + invoices completas)
 */
export async function generateVehicleReport(vehicle: Vehicle, stats: VehicleStats) {
  try {
    const logoBase64 = await loadLogoAsBase64();
    const reportDate = formatDate(new Date().toISOString());

    // Primeira página: Resumo
    const summaryContent: Content[] = [
      // Header com logo
      createGetMotoHeader(logoBase64),

      // Título do relatório
      {
        text: 'VEHICLE SERVICE HISTORY',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },

      // Data do relatório
      {
        text: `Report Date: ${reportDate}`,
        style: 'info',
        alignment: 'center',
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // Informações do veículo
      { text: 'Vehicle Information', style: 'subheader', margin: [0, 0, 0, 5] as [number, number, number, number] },
      createVehicleInfoSection(vehicle),

      // Estatísticas
      { text: 'Service Statistics', style: 'subheader', margin: [0, 0, 0, 5] as [number, number, number, number] },
      createStatsSection(stats),
    ];

    // Páginas seguintes: Invoices completas para cada ordem
    const orders = vehicle.service_order || [];
    const allContent: Content[] = [...summaryContent];

    orders.forEach((order, index) => {
      // Adicionar quebra de página antes de cada invoice
      allContent.push({
        text: '',
        pageBreak: 'before' as any,
      });

      // Criar página de invoice completa
      const invoicePage = createOrderInvoicePage(order, vehicle, logoBase64);
      allContent.push(...invoicePage.content);
    });

    const docDefinition: any = {
      ...defaultDocumentConfig,
      pageOrientation: 'portrait',
      content: allContent,
      styles: {
        ...defaultStyles,
        statLabel: {
          fontSize: 10,
          color: '#666666',
          bold: false,
        },
        statValue: {
          fontSize: 16,
          bold: true,
          color: '#000000',
        },
      },
      pageMargins: [60, 60, 60, 140] as [number, number, number, number],
      footer: (currentPage: number, pageCount: number) => {
        // Primeira página usa footer de relatório
        if (currentPage === 1) {
          return {
            stack: [
              {
                table: {
                  widths: [475],
                  body: [
                    [
                      {
                        columns: [
                          {
                            text: 'If you have any questions concerning this invoice, Please contact us.',
                            fontSize: 9,
                            width: '*',
                          },
                          {
                            text: '     ',
                            fontSize: 9,
                            width: 'auto',
                          },
                          {
                            text: 'Thank you for your business!',
                            fontSize: 9,
                            width: 'auto',
                          },
                        ],
                        margin: [5, 5, 5, 5] as [number, number, number, number],
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
                margin: [60, 0, 0, 0] as [number, number, number, number],
              },
              {
                table: {
                  widths: [475],
                  body: [
                    [
                      {
                        text: `Company Registration No. ${COMPANY_INFO.registration.number}`,
                        alignment: 'center',
                        bold: true,
                        fontSize: 9,
                        margin: [5, 5, 5, 5] as [number, number, number, number],
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
                margin: [60, 0, 0, 0] as [number, number, number, number],
              },
              {
                table: {
                  widths: [475],
                  body: [
                    [
                      {
                        text: `Bank Details. ${COMPANY_INFO.bank.name} Sort Code ${COMPANY_INFO.bank.sortCode}. Account No ${COMPANY_INFO.bank.accountNo}`,
                        alignment: 'center',
                        fontSize: 9,
                        margin: [5, 5, 5, 5] as [number, number, number, number],
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
                margin: [60, 0, 0, 0] as [number, number, number, number],
              },
              {
                columns: [
                  {
                    text: `VEHICLE REPORT`,
                    bold: true,
                    fontSize: 9,
                    width: '33%',
                  },
                  {
                    text: `pag ${currentPage} / ${pageCount}`,
                    bold: true,
                    fontSize: 9,
                    width: '34%',
                    alignment: 'center',
                  },
                  {
                    text: `DATE ${reportDate}`,
                    bold: true,
                    fontSize: 9,
                    width: '33%',
                    alignment: 'right',
                  },
                ],
                margin: [60, 3, 60, 0] as [number, number, number, number],
              },
            ],
          };
        }

        // Páginas seguintes usam footer de invoice
        const orderIndex = currentPage - 2; // Página 2 = ordem 0
        const order = orders[orderIndex];
        const invoiceDate = order ? formatDate(order.created_at) : reportDate;
        const invoiceId = order ? order.service_order_id.toString().padStart(4, '0') : '0000';

        return {
          stack: [
            {
              table: {
                widths: [475],
                body: [
                  [
                    {
                      columns: [
                        {
                          text: 'If you have any questions concerning this invoice, Please contact us.',
                          fontSize: 9,
                          width: '*',
                        },
                        {
                          text: '     ',
                          fontSize: 9,
                          width: 'auto',
                        },
                        {
                          text: 'Thank you for your business!',
                          fontSize: 9,
                          width: 'auto',
                        },
                      ],
                      margin: [5, 5, 5, 5] as [number, number, number, number],
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
              margin: [60, 0, 0, 0] as [number, number, number, number],
            },
            {
              table: {
                widths: [475],
                body: [
                  [
                    {
                      text: `Company Registration No. ${COMPANY_INFO.registration.number}`,
                      alignment: 'center',
                      bold: true,
                      fontSize: 9,
                      margin: [5, 5, 5, 5] as [number, number, number, number],
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
              margin: [60, 0, 0, 0] as [number, number, number, number],
            },
            {
              table: {
                widths: [475],
                body: [
                  [
                    {
                      text: `Bank Details. ${COMPANY_INFO.bank.name} Sort Code ${COMPANY_INFO.bank.sortCode}. Account No ${COMPANY_INFO.bank.accountNo}`,
                      alignment: 'center',
                      fontSize: 9,
                      margin: [5, 5, 5, 5] as [number, number, number, number],
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
              margin: [60, 0, 0, 0] as [number, number, number, number],
            },
            {
              columns: [
                {
                  text: `INVOICE ${invoiceId}`,
                  bold: true,
                  fontSize: 9,
                  width: '33%',
                },
                {
                  text: `pag ${currentPage} / ${pageCount}`,
                  bold: true,
                  fontSize: 9,
                  width: '34%',
                  alignment: 'center',
                },
                {
                  text: `DATE ${invoiceDate}`,
                  bold: true,
                  fontSize: 9,
                  width: '33%',
                  alignment: 'right',
                },
              ],
              margin: [60, 3, 60, 0] as [number, number, number, number],
            },
          ],
        };
      },
      background: (currentPage: number, pageSize: any) => {
        return {
          canvas: [
            {
              type: 'line',
              x1: 40,
              y1: 40,
              x2: 40,
              y2: pageSize.height - 40,
              lineWidth: 1,
              lineColor: '#000000',
            },
            {
              type: 'line',
              x1: pageSize.width - 40,
              y1: 40,
              x2: pageSize.width - 40,
              y2: pageSize.height - 40,
              lineWidth: 1,
              lineColor: '#000000',
            },
            {
              type: 'line',
              x1: 40,
              y1: 40,
              x2: pageSize.width - 40,
              y2: 40,
              lineWidth: 1,
              lineColor: '#000000',
            },
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
        title: `Vehicle Report - ${vehicle.plate}`,
        author: COMPANY_INFO.name,
        subject: 'Vehicle Service History - GetMoto',
        keywords: 'vehicle, service history, report, getmoto',
        creator: COMPANY_INFO.name,
        producer: 'pdfmake',
      },
    };

    pdfMake.createPdf(docDefinition).download(`vehicle-report-${vehicle.plate}-${reportDate.replace(/\//g, '-')}.pdf`);
  } catch (error) {
    console.error('Error generating vehicle report:', error);
    throw error;
  }
}
