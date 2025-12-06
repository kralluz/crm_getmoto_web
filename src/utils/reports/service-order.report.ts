import type { Content } from 'pdfmake/interfaces';
import type { ServiceOrder } from '../../types/service-order';
import { formatCurrency, formatDate, parseDecimal } from '../format.util';
import { defaultDocumentConfig, defaultStyles, createGetMotoHeader, createGetMotoFooter, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

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
 * Calcula totais da ordem de serviço
 */
function calculateTotals(serviceOrder: ServiceOrder) {
  const productsTotal =
    serviceOrder.service_products?.reduce((sum, product) => {
      const qty = parseDecimal(product.product_qtd);
      const price = (product as any).unit_price !== undefined
        ? parseDecimal((product as any).unit_price)
        : parseDecimal(product.products.sell_price);
      return sum + qty * price;
    }, 0) || 0;

  const servicesTotal =
    serviceOrder.services_realized?.reduce((sum, service) => {
      const qty = parseDecimal(service.service_qtd);
      const cost = (service as any).unit_price !== undefined
        ? parseDecimal((service as any).unit_price)
        : parseDecimal(service.service.service_cost);
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
 * Cria seção de informações do cliente e veículo (padrão GetMoto)
 */
function createCustomerVehicleSection(serviceOrder: ServiceOrder): Content {
  const vehicle = serviceOrder.vehicles;

  return {
    columns: [
      // Cliente (lado esquerdo)
      {
        width: '35%',
        table: {
          widths: ['*'],
          body: [
            [{ text: serviceOrder.customer_name || 'N/A', style: 'label', alignment: 'center', margin: [10, 10, 10, 10] as [number, number, number, number] }],
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
              { text: vehicle?.plate || 'N/A', style: 'value', border: [false, true, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
            ],
            [
              { text: 'Make', style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: vehicle?.brand || 'N/A', style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
            ],
            [
              { text: 'Model', style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: vehicle?.model || 'N/A', style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
            ],
            [
              { text: 'Year', style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: vehicle?.year?.toString() || 'N/A', style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
            ],
            [
              { text: 'Odometer / Mile', style: 'label', border: [true, false, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
              { text: serviceOrder.vehicle_mile ? `${serviceOrder.vehicle_mile.toLocaleString('en-GB')} miles` : 'N/A', style: 'value', border: [false, false, true, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
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
 * Cria tabela de itens (produtos e serviços)
 */
function createItemsTable(serviceOrder: ServiceOrder): Content {
  const rows: any[] = [];

  // Adicionar produtos
  if (serviceOrder.service_products && serviceOrder.service_products.length > 0) {
    serviceOrder.service_products.forEach((product) => {
      const qty = parseDecimal(product.product_qtd);
      const price = (product as any).unit_price !== undefined
        ? parseDecimal((product as any).unit_price)
        : parseDecimal(product.products.sell_price);
      const total = qty * price;

      rows.push([
        { text: product.products.product_name, style: 'tableCell', border: [true, true, true, true] },
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
      const cost = (service as any).unit_price !== undefined
        ? parseDecimal((service as any).unit_price)
        : parseDecimal(service.service.service_cost);
      const total = qty * cost;

      rows.push([
        { text: service.service.service_name, style: 'tableCell', border: [true, true, true, true] },
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
        // Linha dupla após o cabeçalho
        if (i === 1) return 2;
        return 1;
      },
      vLineWidth: (i: number, node: any) => {
        // Sem linhas verticais no cabeçalho (primeira linha)
        return 1;
      },
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: (i: number) => (i === 0 ? 5 : 5),
      paddingRight: (i: number) => (i === 0 ? 5 : 5),
      paddingTop: (i: number) => (i === 0 ? 0 : 5),
      paddingBottom: (i: number) => (i === 0 ? 8 : 3),
    },
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria caixa de total com desconto
 */
function createTotalsBox(serviceOrder: ServiceOrder, totals: ReturnType<typeof calculateTotals>): Content {
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
      { text: '', width: '*' }, // Espaço vazio à esquerda
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
 * Gera o relatório completo de Ordem de Serviço em PDF (padrão GetMoto Invoice)
 */
export async function generateServiceOrderReport(serviceOrder: ServiceOrder): Promise<void> {
  const totals = calculateTotals(serviceOrder);
  const invoiceDate = formatDate(serviceOrder.created_at);

  // Carregar logo
  const logoBase64 = await loadLogoAsBase64();

  const content: Content = [
    createGetMotoHeader(logoBase64),
    createCustomerVehicleSection(serviceOrder),
    createItemsTable(serviceOrder),
  ];

  // Adicionar notes se existir
  if (serviceOrder.notes && serviceOrder.notes.trim() !== '') {
    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: serviceOrder.notes,
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

  content.push(createTotalsBox(serviceOrder, totals));

  const docDefinition: any = {
    ...defaultDocumentConfig,
    pageOrientation: 'portrait',
    content,
    styles: defaultStyles,
    pageMargins: [60, 60, 60, 140] as [number, number, number, number], // Margens: esquerda, topo, direita, inferior
    footer: (currentPage: number, pageCount: number) => {
      return {
        stack: [
          // Box 1: Mensagens de contato
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
          // Box 2: Registro da empresa
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
          // Box 3: Detalhes bancários
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
          // Invoice number, data e paginação
          {
            columns: [
              {
                text: `INVOICE ${serviceOrder.service_order_id.toString().padStart(4, '0')}`,
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
      title: `Invoice ${serviceOrder.service_order_id}`,
      author: COMPANY_INFO.name,
      subject: 'Service Order Invoice - GetMoto',
      keywords: 'invoice, service order, getmoto',
      creator: COMPANY_INFO.name,
      producer: 'pdfmake',
    },
  };

  pdfMake.createPdf(docDefinition).download(`invoice_${serviceOrder.service_order_id.toString().padStart(4, '0')}.pdf`);
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
 * Gera PDF de orçamento (antes de criar a OS) - padrão GetMoto
 */
export async function generateBudgetPDF(data: BudgetData, t?: (key: string) => string): Promise<void> {
  const customerName = data.customer_name && data.customer_name.trim() !== ''
    ? data.customer_name
    : 'Cliente não informado';

  // Carregar logo
  const logoBase64 = await loadLogoAsBase64();

  // Calcular totais
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

  // Criar linhas da tabela
  const rows: any[] = [];

  // Produtos
  data.products.forEach((p) => {
    const qty = Number(p.product_qtd) || 0;
    const price = Number(p.unit_price) || 0;
    const itemTotal = qty * price;

    rows.push([
      { text: p.product_name, style: 'tableCell', border: [true, true, true, true] },
      { text: qty.toFixed(2), style: 'tableCell', alignment: 'center', border: [true, true, true, true] },
      { text: formatCurrency(price), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
      { text: formatCurrency(itemTotal), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
    ]);
  });

  // Serviços
  data.services.forEach((s) => {
    const qty = Number(s.service_qtd) || 0;
    const price = Number(s.unit_price) || 0;
    const itemTotal = qty * price;

    rows.push([
      { text: s.service_name, style: 'tableCell', border: [true, true, true, true] },
      { text: qty.toFixed(0), style: 'tableCell', alignment: 'center', border: [true, true, true, true] },
      { text: formatCurrency(price), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
      { text: formatCurrency(itemTotal), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
    ]);
  });

  const content: Content = [
    createGetMotoHeader(logoBase64),

    // Cliente
    {
      table: {
        widths: ['*'],
        body: [
          [{ text: customerName, style: 'label', alignment: 'center', margin: [10, 10, 10, 10] as [number, number, number, number] }],
        ],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
      },
      // @ts-expect-error - pdfmake allows width in table definition
      width: '40%',
      margin: [0, 0, 0, 20] as [number, number, number, number],
    },

    // Tabela de itens
    {
      table: {
        headerRows: 1,
        widths: ['*', '10%', '20%', '20%'],
        body: [
          [
            { text: t ? t('services.description') : 'Description', style: 'tableHeader', alignment: 'left', border: [true, true, true, true], margin: [5, 8, 5, 8] as [number, number, number, number] },
            { text: t ? t('services.quantity') : 'Qty', style: 'tableHeader', border: [false, true, false, true], margin: [5, 8, 5, 8] as [number, number, number, number] },
            { text: t ? t('services.unitPrice') : 'Unit Price', style: 'tableHeader', border: [false, true, false, true], margin: [5, 8, 5, 8] as [number, number, number, number] },
            { text: t ? t('services.amount') : 'Amount', style: 'tableHeader', border: [true, true, true, true], margin: [5, 8, 5, 8] as [number, number, number, number] },
          ],
          ...rows,
        ],
      },
      layout: {
        hLineWidth: (i: number) => {
          // Linha dupla após o cabeçalho
          if (i === 1) return 2;
          return 1;
        },
        vLineWidth: (i: number, node: any) => {
          // Sem linhas verticais no cabeçalho (primeira linha)
          return 1;
        },
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
        paddingLeft: (i: number) => (i === 0 ? 5 : 5),
        paddingRight: (i: number) => (i === 0 ? 5 : 5),
        paddingTop: (i: number) => (i === 0 ? 0 : 5),
        paddingBottom: (i: number) => (i === 0 ? 8 : 3),
      },
      margin: [0, 0, 0, 20] as [number, number, number, number],
    },

    // Totais com desconto
    {
      columns: [
        { text: '', width: '*' }, // Espaço vazio à esquerda
        {
          width: 'auto',
          table: {
            widths: [80, 100],
            body: [
              // Subtotal
              [
                { text: t ? t('services.subtotal') : 'Subtotal', style: 'label', alignment: 'right' as const, margin: [10, 5, 5, 5] as [number, number, number, number] },
                { text: formatCurrency(subtotal), style: 'value', alignment: 'right' as const, margin: [5, 5, 10, 5] as [number, number, number, number] },
              ],
              // Desconto (se houver)
              ...(discountValue > 0 ? [[
                { 
                  text: data.discount_percent 
                    ? `${t ? t('services.discount') : 'Discount'} (${data.discount_percent.toFixed(2)}%)` 
                    : t ? t('services.discount') : 'Discount',
                  style: 'label', 
                  alignment: 'right' as const, 
                  margin: [10, 5, 5, 5] as [number, number, number, number],
                  color: '#ff4d4f'
                },
                { text: `- ${formatCurrency(discountValue)}`, style: 'value', alignment: 'right' as const, margin: [5, 5, 10, 5] as [number, number, number, number], color: '#ff4d4f' },
              ]] : []),
              // Total
              [
                { text: t ? t('services.total') : 'Total', style: 'totalLabel', alignment: 'right' as const, margin: [10, 5, 5, 5] as [number, number, number, number] },
                { text: formatCurrency(total), style: 'totalValue', alignment: 'right' as const, margin: [5, 5, 10, 5] as [number, number, number, number] },
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
    },
  ];

  const budgetDate = formatDate(new Date());

  const docDefinition: any = {
    ...defaultDocumentConfig,
    pageOrientation: 'portrait',
    content,
    styles: defaultStyles,
    footer: createGetMotoFooter('BUDGET', budgetDate),
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
      title: `Budget - ${customerName}`,
      author: COMPANY_INFO.name,
      subject: 'Budget - GetMoto',
      keywords: 'budget, estimate, getmoto',
      creator: COMPANY_INFO.name,
      producer: 'pdfmake',
    },
  };

  const fileName = `budget_${customerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
}
