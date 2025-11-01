import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDateTime } from '../format.util';
import { generatePdf } from '../pdf.util';

/**
 * Interface para dados de fluxo de caixa
 */
export interface CashFlowEntry {
  cash_flow_id: number;
  amount: number;
  direction: string;
  occurred_at: string;
  note?: string;
  created_at: string;
}

/**
 * Interface para resumo do fluxo de caixa
 */
export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

/**
 * Interface para resumo por categoria
 */
export interface CategorySummary {
  category: string;
  type: string;
  total: number;
  count: number;
}

/**
 * Interface para dados completos do relatório
 */
export interface CashFlowReportData {
  entries: CashFlowEntry[];
  summary: CashFlowSummary;
  categorySummary?: CategorySummary[];
  startDate?: string;
  endDate?: string;
}

/**
 * Cria seção de resumo geral
 */
function createSummarySection(summary: CashFlowSummary): Content {
  return [
    { text: 'Resumo Geral', style: 'subheader' },
    {
      table: {
        widths: ['*', '30%'],
        body: [
          [
            { text: 'Total de Entradas:', style: 'label', alignment: 'right' },
            {
              text: formatCurrency(summary.totalIncome),
              style: 'value',
              alignment: 'right',
              color: '#52c41a',
              bold: true,
            },
          ],
          [
            { text: 'Total de Saídas:', style: 'label', alignment: 'right' },
            {
              text: formatCurrency(summary.totalExpense),
              style: 'value',
              alignment: 'right',
              color: '#ff4d4f',
              bold: true,
            },
          ],
          [
            { text: 'SALDO:', style: 'totalLabel', alignment: 'right', fillColor: '#f0f0f0' },
            {
              text: formatCurrency(summary.balance),
              style: 'totalValue',
              alignment: 'right',
              fillColor: '#f0f0f0',
              color: summary.balance >= 0 ? '#52c41a' : '#ff4d4f',
              bold: true,
              fontSize: 12,
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
 * Cria seção de resumo por categoria
 */
function createCategorySummarySection(categorySummary: CategorySummary[]): Content {
  if (!categorySummary || categorySummary.length === 0) {
    return [];
  }

  const rows = categorySummary.map((item) => [
    { text: item.category, style: 'tableCell' },
    {
      text: item.type === 'INCOME' ? 'Entrada' : 'Saída',
      style: 'tableCell',
      alignment: 'center',
      color: item.type === 'INCOME' ? '#52c41a' : '#ff4d4f',
    },
    { text: item.count.toString(), style: 'tableCell', alignment: 'center' },
    {
      text: formatCurrency(item.total),
      style: 'tableCell',
      alignment: 'right',
      bold: true,
    },
  ]);

  return [
    { text: 'Resumo por Categoria', style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['*', '20%', '15%', '25%'],
        body: [
          [
            { text: 'Categoria', style: 'tableHeader' },
            { text: 'Tipo', style: 'tableHeader' },
            { text: 'Qtd', style: 'tableHeader' },
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
 * Cria seção de listagem de transações
 */
function createEntriesSection(entries: CashFlowEntry[]): Content {
  if (!entries || entries.length === 0) {
    return [
      { text: 'Transações', style: 'subheader' },
      { text: 'Nenhuma transação encontrada no período selecionado.', style: 'info', italics: true },
    ];
  }

  const rows = entries.map((entry) => [
    { text: formatDateTime(entry.occurred_at), style: 'tableCell', fontSize: 8 },
    {
      text: entry.direction === 'entrada' ? 'Entrada' : 'Saída',
      style: 'tableCell',
      alignment: 'center',
      color: entry.direction === 'entrada' ? '#52c41a' : '#ff4d4f',
      bold: true,
    },
    {
      text: formatCurrency(entry.amount),
      style: 'tableCell',
      alignment: 'right',
      bold: true,
      color: entry.direction === 'entrada' ? '#52c41a' : '#ff4d4f',
    },
    { text: entry.note || '-', style: 'tableCell', fontSize: 8 },
  ]);

  return [
    { text: 'Detalhamento de Transações', style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['18%', '15%', '20%', '*'],
        body: [
          [
            { text: 'Data', style: 'tableHeader' },
            { text: 'Tipo', style: 'tableHeader' },
            { text: 'Valor', style: 'tableHeader' },
            { text: 'Descrição', style: 'tableHeader' },
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
    } as any,
  ];
}

/**
 * Gera o relatório de Fluxo de Caixa em PDF
 */
export function generateCashFlowReport(data: CashFlowReportData): void {
  const { entries, summary, categorySummary, startDate, endDate } = data;

  // Criar informações do período
  const periodInfo: string[] = [];
  if (startDate && endDate) {
    periodInfo.push(`Período: ${formatDateTime(startDate, 'DD/MM/YYYY')} até ${formatDateTime(endDate, 'DD/MM/YYYY')}`);
  } else if (startDate) {
    periodInfo.push(`A partir de: ${formatDateTime(startDate, 'DD/MM/YYYY')}`);
  } else if (endDate) {
    periodInfo.push(`Até: ${formatDateTime(endDate, 'DD/MM/YYYY')}`);
  }

  const content: Content = [
    ...(createSummarySection(summary) as any[]),
    ...(createCategorySummarySection(categorySummary || []) as any[]),
    ...(createEntriesSection(entries) as any[]),
  ];

  generatePdf(content, `fluxo_caixa_${new Date().getTime()}.pdf`, {
    header: {
      title: 'Relatório de Fluxo de Caixa',
      subtitle: periodInfo.length > 0 ? periodInfo[0] : undefined,
      customInfo: periodInfo.slice(1),
    },
    info: {
      title: 'Relatório de Fluxo de Caixa',
      subject: 'Demonstrativo Financeiro - CRM GetMoto',
      keywords: 'fluxo de caixa, financeiro, entradas, saídas',
    },
  });
}
