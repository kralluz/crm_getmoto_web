import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, parseDecimal } from '../format.util';
import { generatePdf } from '../pdf.util';

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
    legend: string;
    legendItems: {
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
    { text: t?.summary || 'Resumo', style: 'subheader' },
    {
      table: {
        widths: ['*', '40%'],
        body: [
          [
            { text: t?.totalProducts || 'Total de Produtos em Falta:', style: 'label', alignment: 'right' },
            { text: totalProducts.toString(), style: 'value', alignment: 'right', bold: true },
          ],
          [
            { text: t?.estimatedValue || 'Valor Estimado para Reposição:', style: 'totalLabel', alignment: 'right', fillColor: '#fff7e6' },
            {
              text: formatCurrency(totalEstimatedCost),
              style: 'totalValue',
              alignment: 'right',
              fillColor: '#fff7e6',
              color: '#ff9800',
              bold: true,
            },
          ],
        ],
      },
      layout: {
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
 * Cria seção de produtos em falta
 */
function createProductsSection(products: Product[], t: LowStockReportData['translations']): Content {
  if (products.length === 0) {
    return [
      { text: t?.productsSection || 'Produtos com Estoque Baixo', style: 'subheader' },
      {
        text: t?.noProducts || 'Nenhum produto com estoque abaixo do mínimo! 🎉',
        style: 'info',
        italics: true,
        color: '#52c41a',
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
    const criticality = currentQty / minQty;
    let statusColor = '#ff4d4f'; // vermelho (crítico)
    let statusText = t?.statusLabels?.critical || 'CRÍTICO';

    if (criticality > 0.5) {
      statusColor = '#ff9800'; // laranja (atenção)
      statusText = t?.statusLabels?.attention || 'ATENÇÃO';
    }
    if (currentQty === 0) {
      statusColor = '#8b0000'; // vermelho escuro (zerado)
      statusText = t?.statusLabels?.depleted || 'ZERADO';
    }

    return [
      { text: product.product_name, style: 'tableCell' },
      {
        text: product.product_category?.product_category_name || '-',
        style: 'tableCell',
        alignment: 'center',
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
      { text: currentQty.toFixed(2), style: 'tableCell', alignment: 'center' },
      { text: minQty.toFixed(2), style: 'tableCell', alignment: 'center' },
      {
        text: qtyToBuy.toFixed(2),
        style: 'tableCell',
        alignment: 'center',
        bold: true,
        color: '#ff4d4f',
      },
      { text: formatCurrency(buyPrice), style: 'tableCell', alignment: 'right', fontSize: 8 },
      { text: formatCurrency(estimatedCost), style: 'tableCell', alignment: 'right', bold: true },
    ];
  });

  return [
    { text: t?.productsSection || 'Produtos com Estoque Baixo', style: 'subheader' },
    { text: t?.productsInfo || '⚠️ Produtos que precisam de reposição urgente', style: 'info', italics: true, margin: [0, 0, 0, 10] },
    {
      table: {
        headerRows: 1,
        widths: ['*', '12%', '10%', '8%', '8%', '10%', '12%', '12%'],
        body: [
          [
            { text: t?.tableHeaders?.product || 'Produto', style: 'tableHeader', fontSize: 9 },
            { text: t?.tableHeaders?.category || 'Categoria', style: 'tableHeader', fontSize: 9 },
            { text: t?.tableHeaders?.status || 'Status', style: 'tableHeader', fontSize: 9 },
            { text: t?.tableHeaders?.current || 'Atual', style: 'tableHeader', fontSize: 9 },
            { text: t?.tableHeaders?.minimum || 'Mínimo', style: 'tableHeader', fontSize: 9 },
            { text: t?.tableHeaders?.toBuy || 'Comprar', style: 'tableHeader', fontSize: 9 },
            { text: t?.tableHeaders?.unitPrice || 'Preço Un.', style: 'tableHeader', fontSize: 9 },
            { text: t?.tableHeaders?.total || 'Total', style: 'tableHeader', fontSize: 9 },
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
 * Cria seção de legenda
 */
function createLegendSection(t: LowStockReportData['translations']): Content {
  return [
    {
      text: '',
      margin: [0, 15, 0, 5] as [number, number, number, number],
    },
    { text: t?.legend || 'Legenda de Status:', style: 'label', fontSize: 9 },
    {
      ul: [
        { text: t?.legendItems?.depleted || 'ZERADO: Estoque completamente esgotado', color: '#8b0000', fontSize: 8 },
        { text: t?.legendItems?.critical || 'CRÍTICO: Estoque abaixo de 50% do mínimo', color: '#ff4d4f', fontSize: 8 },
        { text: t?.legendItems?.attention || 'ATENÇÃO: Estoque entre 50% e 100% do mínimo', color: '#ff9800', fontSize: 8 },
      ],
      margin: [0, 5, 0, 0] as [number, number, number, number],
    },
  ];
}

/**
 * Gera o relatório de Alerta de Estoque Baixo em PDF
 */
export function generateLowStockReport(data: LowStockReportData): void {
  const { products, translations: t } = data;

  const content: Content = [
    ...(createSummarySection(products, t) as any[]),
    ...(createProductsSection(products, t) as any[]),
    ...(createLegendSection(t) as any[]),
  ];

  generatePdf(content, `alerta_estoque_${new Date().getTime()}.pdf`, {
    header: {
      title: t?.title || 'Alerta de Estoque Baixo',
      subtitle: t?.subtitle || `${products.length} produto(s) necessitando reposição`,
    },
    info: {
      title: t?.title || 'Alerta de Estoque Baixo',
      subject: 'Controle de Estoque - CRM GetMoto',
      keywords: 'estoque, alerta, reposição, produtos',
    },
    pageOrientation: 'landscape', // Paisagem para mais colunas
  });
}
