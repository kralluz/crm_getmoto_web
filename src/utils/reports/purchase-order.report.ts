import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDate } from '../format.util';
import { defaultDocumentConfig, defaultStyles, createGetMotoHeader, createGetMotoFooter, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

/**
 * Interface para produtos da ordem de compra
 */
export interface PurchaseOrderProduct {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/**
 * Interface para dados da ordem de compra
 */
export interface PurchaseOrderData {
  purchase_order_id: number | string;
  supplier_name: string;
  purchase_date: string;
  total_amount: number;
  notes?: string;
  products: PurchaseOrderProduct[];
  created_at: string;
  is_active: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
}

/**
 * Interface para traduções
 */
export interface PurchaseOrderTranslations {
  title: string;
  orderNumber: string;
  supplier: string;
  purchaseDate: string;
  status: string;
  active: string;
  cancelled: string;
  products: string;
  product: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  total: string;
  notes: string;
  cancelledAt: string;
  cancellationReason: string;
  createdAt: string;
  stockImpact: string;
  thankYou: string;
}

/**
 * Cria seção de informações gerais
 */
function createInfoSection(data: PurchaseOrderData, t: PurchaseOrderTranslations): Content {
  return {
    table: {
      widths: ['35%', '*'],
      body: [
        [
          { text: t.supplier, style: 'label', border: [true, true, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: data.supplier_name, style: 'value', border: [false, true, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
        ],
        [
          { text: t.purchaseDate, style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: formatDate(data.purchase_date), style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
        ],
        [
          { text: t.createdAt, style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: formatDate(data.created_at), style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
        ],
        [
          { text: t.status, style: 'label', border: [true, false, false, true], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { 
            text: data.is_active ? t.active : t.cancelled, 
            style: 'value', 
            color: data.is_active ? '#52c41a' : '#ff4d4f',
            bold: true,
            border: [false, false, true, true], 
            margin: [5, 4, 5, 4] as [number, number, number, number] 
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
  };
}

/**
 * Cria seção de produtos
 */
function createProductsSection(products: PurchaseOrderProduct[], t: PurchaseOrderTranslations): Content[] {
  const rows = products.map((product) => [
    { text: product.product_name, style: 'tableCell', border: [true, true, true, true] },
    { text: `+${product.quantity}`, style: 'tableCell', alignment: 'center', color: '#52c41a', bold: true, border: [true, true, true, true] },
    { text: formatCurrency(product.unit_price), style: 'tableCell', alignment: 'right', border: [true, true, true, true] },
    { text: formatCurrency(product.subtotal), style: 'tableCell', alignment: 'right', bold: true, border: [true, true, true, true] },
  ]);

  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalAmount = products.reduce((sum, p) => sum + p.subtotal, 0);

  return [
    { text: t.products, style: 'subheader' },
    // @ts-expect-error - pdfmake type compatibility issue
    {
      table: {
        headerRows: 1,
        widths: ['*', '15%', '20%', '20%'],
        body: [
          [
            { text: t.product, style: 'tableHeader', border: [true, true, true, true] },
            { text: t.quantity, style: 'tableHeader', border: [true, true, true, true] },
            { text: t.unitPrice, style: 'tableHeader', border: [true, true, true, true] },
            { text: t.subtotal, style: 'tableHeader', border: [true, true, true, true] },
          ],
          ...rows,
          [
            { text: t.total, style: 'totalLabel', border: [true, true, true, true], alignment: 'right' },
            { text: `+${totalQuantity}`, style: 'totalValue', border: [true, true, true, true], alignment: 'center', color: '#52c41a' },
            { text: '', style: 'tableCell', border: [true, true, true, true] },
            { text: formatCurrency(totalAmount), style: 'totalValue', border: [true, true, true, true], alignment: 'right', fontSize: 12, color: '#ff4d4f' },
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
 * Cria seção de observações
 */
function createNotesSection(data: PurchaseOrderData, t: PurchaseOrderTranslations): Content[] {
  if (!data.notes) return [];

  return [
    { text: t.notes, style: 'subheader' },
    {
      text: data.notes,
      style: 'value',
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

/**
 * Cria seção de informações de cancelamento
 */
function createCancellationSection(data: PurchaseOrderData, t: PurchaseOrderTranslations): Content[] {
  if (!data.cancelled_at) return [];

  return [
    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: t.cancelled,
              style: 'label',
              alignment: 'center',
              color: '#ff4d4f',
              bold: true,
              fontSize: 12,
              margin: [10, 5, 10, 5] as [number, number, number, number],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 2,
        vLineWidth: () => 2,
        hLineColor: () => '#ff4d4f',
        vLineColor: () => '#ff4d4f',
      },
      margin: [0, 0, 0, 10] as [number, number, number, number],
    },
    {
      table: {
        widths: ['35%', '*'],
        body: [
          [
            { text: t.cancelledAt, style: 'label', border: [true, true, false, false] as [boolean, boolean, boolean, boolean], margin: [5, 4, 5, 4] as [number, number, number, number] },
            { text: formatDate(data.cancelled_at), style: 'value', border: [false, true, true, false] as [boolean, boolean, boolean, boolean], margin: [5, 4, 5, 4] as [number, number, number, number] },
          ],
          ...(data.cancellation_reason
            ? [
                [
                  { text: t.cancellationReason, style: 'label', border: [true, false, false, true] as [boolean, boolean, boolean, boolean], margin: [5, 4, 5, 4] as [number, number, number, number] },
                  { text: data.cancellation_reason, style: 'value', border: [false, false, true, true] as [boolean, boolean, boolean, boolean], margin: [5, 4, 5, 4] as [number, number, number, number] },
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
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

/**
 * Gera PDF da ordem de compra
 */
export async function generatePurchaseOrderPDF(
  data: PurchaseOrderData,
  translations: PurchaseOrderTranslations
): Promise<void> {
  const logoBase64 = await loadLogoAsBase64();

  const docDefinition: any = {
    ...defaultDocumentConfig,
    header: createGetMotoHeader(logoBase64),
    footer: createGetMotoFooter(),
    content: [
      // Título e número da ordem
      {
        columns: [
          { text: translations.title, style: 'header' },
          { text: `${translations.orderNumber}: #${data.purchase_order_id}`, style: 'header', alignment: 'right' },
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // Informações gerais
      createInfoSection(data, translations),

      // Seção de cancelamento (se aplicável)
      ...createCancellationSection(data, translations),

      // Produtos
      ...createProductsSection(data.products, translations),

      // Observações
      ...createNotesSection(data, translations),

      // Nota sobre impacto no estoque
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: translations.stockImpact,
                style: 'value',
                fontSize: 9,
                color: '#666666',
                italics: true,
                alignment: 'center',
                margin: [10, 5, 10, 5] as [number, number, number, number],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
      },
    ],
    styles: defaultStyles,
  };

  pdfMake.createPdf(docDefinition).download(`ordem-compra-${data.purchase_order_id}.pdf`);
}
