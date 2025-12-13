import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, parseDecimal } from '../format.util';
import { defaultDocumentConfig, defaultStyles, createGetMotoHeader, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

/**
 * Interface para produto
 */
export interface Product {
  product_id: number;
  product_name: string;
  quantity: number;
  quantity_alert: number;
  buy_price: number;
  sell_price: number;
  category_id?: number;
  product_category?: {
    product_category_name: string;
  };
}

/**
 * Interface para dados do relatório de estoque baixo
 */
export interface LowStockReportData {
  products: Product[];
  translations?: {
    title: string;
    subtitle: string;
    summary: string;
    totalProducts: string;
    estimatedValue: string;
    productsSection: string;
    productsInfo: string;
    noProducts: string;
    tableHeaders: {
      product: string;
      category: string;
      status: string;
      current: string;
      minimum: string;
      toBuy: string;
      unitPrice: string;
      total: string;
    };
    statusLabels: {
      depleted: string;
      critical: string;
      attention: string;
    };
  };
}

/**
 * Cria seção de resumo
 */
function createSummarySection(products: Product[], t: LowStockReportData['translations']): Content {
  const totalProducts = products.length;
  const totalEstimatedCost = products.reduce((sum, product) => {
    const currentQty = parseDecimal(product.quantity);
    const minQty = parseDecimal(product.quantity_alert);
    const qtyToBuy = Math.max(0, minQty - currentQty);
    const buyPrice = parseDecimal(product.buy_price);
    return sum + qtyToBuy * buyPrice;
  }, 0);

  return [
    { text: t?.summary || 'Summary', style: 'subheader' },
    {
      table: {
        widths: ['*', '40%'],
        body: [
          [
            { text: t?.totalProducts || 'Total Products Low Stock:', style: 'label', alignment: 'right', border: [true, true, true, true] },
            { text: totalProducts.toString(), style: 'value', alignment: 'right', bold: true, border: [true, true, true, true] },
          ],
          [
            { text: t?.estimatedValue || 'Estimated Replenishment Value:', style: 'totalLabel', alignment: 'right', border: [true, true, true, true] },
            {
              text: formatCurrency(totalEstimatedCost),
              style: 'totalValue',
              alignment: 'right',
              bold: true,
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
 * Cria seção de produtos em falta
 */
function createProductsSection(products: Product[], t: LowStockReportData['translations']): Content {
  if (products.length === 0) {
    return [
      { text: t?.productsSection || 'Low Stock Products', style: 'subheader' },
      {
        text: t?.noProducts || 'No products below minimum stock!',
        style: 'info',
        bold: true,
        alignment: 'center',
        margin: [0, 20, 0, 20] as [number, number, number, number],
      },
    ];
  }

  const rows = products.map((product) => {
    const currentQty = parseDecimal(product.quantity);
    const minQty = parseDecimal(product.quantity_alert);
    const qtyToBuy = Math.max(0, minQty - currentQty);
    const buyPrice = parseDecimal(product.buy_price);
    const estimatedCost = qtyToBuy * buyPrice;

    // Calcular nível de criticidade
    let statusText = t?.statusLabels?.attention || 'ATTENTION';
    const attentionThreshold = minQty * 1.5; // 150% do mínimo

    if (currentQty === 0) {
      statusText = t?.statusLabels?.depleted || 'DEPLETED';
    } else if (currentQty <= minQty) {
      statusText = t?.statusLabels?.critical || 'CRITICAL';
    } else if (currentQty <= attentionThreshold) {
      statusText = t?.statusLabels?.attention || 'ATTENTION';
    }

    return [
      { text: product.product_name, style: 'tableCell', border: [true, true, true, true] },
      {
        text: product.product_category?.product_category_name || '-',
        style: 'tableCell',
        alignment: 'center',
        fontSize: 8,
        border: [true, true, true, true],
      },
      {
        text: statusText,
        style: 'tableCell',
        alignment: 'center',
        bold: true,
        fontSize: 8,
        border: [true, true, true, true],
      },
      { text: currentQty.toFixed(2), style: 'tableCell', alignment: 'center', border: [true, true, true, true] },
      { text: minQty.toFixed(2), style: 'tableCell', alignment: 'center', border: [true, true, true, true] },
      {
        text: qtyToBuy.toFixed(2),
        style: 'tableCell',
        alignment: 'center',
        bold: true,
        border: [true, true, true, true],
      },
      { text: formatCurrency(buyPrice), style: 'tableCell', alignment: 'right', fontSize: 8, border: [true, true, true, true] },
      { text: formatCurrency(estimatedCost), style: 'tableCell', alignment: 'right', bold: true, border: [true, true, true, true] },
    ];
  });

  return [
    { text: t?.productsSection || 'Low Stock Products', style: 'subheader' },
    { text: t?.productsInfo || 'Products requiring urgent replenishment', style: 'info', margin: [0, 0, 0, 10] as [number, number, number, number] },
    // @ts-expect-error - pdfmake type compatibility issue
    {
      table: {
        headerRows: 1,
        widths: ['*', '12%', '10%', '8%', '8%', '10%', '12%', '12%'],
        body: [
          [
            { text: t?.tableHeaders?.product || 'Product', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: t?.tableHeaders?.category || 'Category', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: t?.tableHeaders?.status || 'Status', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: t?.tableHeaders?.current || 'Current', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: t?.tableHeaders?.minimum || 'Minimum', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: t?.tableHeaders?.toBuy || 'To Buy', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: t?.tableHeaders?.unitPrice || 'Unit Price', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
            { text: t?.tableHeaders?.total || 'Total', style: 'tableHeader', fontSize: 9, border: [true, true, true, true] },
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
 * Gera o relatório de Alerta de Estoque Baixo em PDF
 */
export async function generateLowStockReport(data: LowStockReportData): Promise<void> {
  const { products, translations: t } = data;

  // Carregar logo
  const logoBase64 = await loadLogoAsBase64();

  const content: Content = [
    createGetMotoHeader(logoBase64),
    { text: t?.title || 'Low Stock Alert', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] as [number, number, number, number] },
    ...(createSummarySection(products, t) as any[]),
    ...(createProductsSection(products, t) as any[]),
  ];

  // Data do relatório
  content.push({
    columns: [
      {
        text: `${new Date().toLocaleDateString('en-GB')}`,
        bold: true,
        fontSize: 9,
        width: '100%',
        alignment: 'right',
      },
    ],
    margin: [0, 20, 0, 0] as [number, number, number, number],
  });

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
      title: t?.title || 'Low Stock Alert',
      author: COMPANY_INFO.name,
      subject: 'Stock Control - GetMoto',
      keywords: 'stock, alert, replenishment, products',
      creator: COMPANY_INFO.name,
      producer: 'pdfmake',
    },
  };

  pdfMake.createPdf(docDefinition).download(`low_stock_alert_${new Date().getTime()}.pdf`);
}
