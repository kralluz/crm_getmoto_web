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
  t?: (key: string) => string; // Função de tradução
}

/**
 * Cria seção de resumo geral
 */
function createSummarySection(summary: CashFlowSummary, t: (key: string) => string): Content {
  return [
    { text: t('dashboard.generalSummary'), style: 'subheader' },
    {
      table: {
        widths: ['*', '30%'],
        body: [
          [
            { text: t('dashboard.totalIncomeLabel'), style: 'label', alignment: 'right' },
            {
              text: formatCurrency(summary.totalIncome),
              style: 'value',
              alignment: 'right',
              color: '#52c41a',
              bold: true,
            },
          ],
          [
            { text: t('dashboard.totalExpenseLabel'), style: 'label', alignment: 'right' },
            {
              text: formatCurrency(summary.totalExpense),
              style: 'value',
              alignment: 'right',
              color: '#ff4d4f',
              bold: true,
            },
          ],
          [
            { text: t('dashboard.balanceLabel'), style: 'totalLabel', alignment: 'right', fillColor: '#f0f0f0' },
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
function createCategorySummarySection(categorySummary: CategorySummary[], t: (key: string) => string): Content {
  if (!categorySummary || categorySummary.length === 0) {
    return [];
  }

  const rows = categorySummary.map((item) => [
    { text: item.category, style: 'tableCell' },
    {
      text: item.type === 'INCOME' ? t('dashboard.income') : t('dashboard.expense'),
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
    { text: t('dashboard.categoryBreakdown'), style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['*', '20%', '15%', '25%'],
        body: [
          [
            { text: t('dashboard.category'), style: 'tableHeader' },
            { text: t('dashboard.type'), style: 'tableHeader' },
            { text: t('dashboard.quantity'), style: 'tableHeader' },
            { text: t('dashboard.total'), style: 'tableHeader' },
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
function createEntriesSection(entries: CashFlowEntry[], t: (key: string) => string): Content {
  if (!entries || entries.length === 0) {
    return [
      { text: t('dashboard.transactions'), style: 'subheader' },
      { text: t('dashboard.noTransactionsFound'), style: 'info', italics: true },
    ];
  }

  const rows = entries.map((entry) => [
    { text: formatDateTime(entry.occurred_at), style: 'tableCell', fontSize: 8 },
    {
      text: entry.direction === 'entrada' ? t('dashboard.income') : t('dashboard.expense'),
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
    { text: t('dashboard.transactionDetails'), style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['18%', '15%', '20%', '*'],
        body: [
          [
            { text: t('dashboard.date'), style: 'tableHeader' },
            { text: t('dashboard.type'), style: 'tableHeader' },
            { text: t('dashboard.value'), style: 'tableHeader' },
            { text: t('dashboard.description'), style: 'tableHeader' },
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
  const { entries, summary, categorySummary, startDate, endDate, t } = data;

  // Função de tradução padrão (português) se não fornecida
  const translate = t || ((key: string) => {
    const translations: Record<string, string> = {
      'dashboard.generalSummary': 'Resumo Geral',
      'dashboard.totalIncomeLabel': 'Total de Entradas:',
      'dashboard.totalExpenseLabel': 'Total de Saídas:',
      'dashboard.balanceLabel': 'SALDO:',
      'dashboard.categoryBreakdown': 'Resumo por Categoria',
      'dashboard.category': 'Categoria',
      'dashboard.type': 'Tipo',
      'dashboard.quantity': 'Qtd',
      'dashboard.total': 'Total',
      'dashboard.income': 'Entrada',
      'dashboard.expense': 'Saída',
      'dashboard.transactions': 'Transações',
      'dashboard.noTransactionsFound': 'Nenhuma transação encontrada no período selecionado.',
      'dashboard.transactionDetails': 'Detalhamento de Transações',
      'dashboard.date': 'Data',
      'dashboard.value': 'Valor',
      'dashboard.description': 'Descrição',
      'dashboard.period': 'Período',
      'dashboard.from': 'A partir de',
      'dashboard.until': 'Até',
      'dashboard.cashFlowReport': 'Relatório de Fluxo de Caixa',
      'dashboard.financialStatement': 'Demonstrativo Financeiro - CRM GetMoto',
      'dashboard.keywords': 'fluxo de caixa, financeiro, entradas, saídas',
    };
    return translations[key] || key;
  });

  // Criar informações do período
  const periodInfo: string[] = [];
  if (startDate && endDate) {
    periodInfo.push(`${translate('dashboard.period')}: ${formatDateTime(startDate, 'DD/MM/YYYY')} ${translate('dashboard.until')} ${formatDateTime(endDate, 'DD/MM/YYYY')}`);
  } else if (startDate) {
    periodInfo.push(`${translate('dashboard.from')}: ${formatDateTime(startDate, 'DD/MM/YYYY')}`);
  } else if (endDate) {
    periodInfo.push(`${translate('dashboard.until')}: ${formatDateTime(endDate, 'DD/MM/YYYY')}`);
  }

  const content: Content = [
    ...(createSummarySection(summary, translate) as any[]),
    ...(createCategorySummarySection(categorySummary || [], translate) as any[]),
    ...(createEntriesSection(entries, translate) as any[]),
  ];

  generatePdf(content, `fluxo_caixa_${new Date().getTime()}.pdf`, {
    header: {
      title: translate('dashboard.cashFlowReport'),
      subtitle: periodInfo.length > 0 ? periodInfo[0] : undefined,
      customInfo: periodInfo.slice(1),
    },
    info: {
      title: translate('dashboard.cashFlowReport'),
      subject: translate('dashboard.financialStatement'),
      keywords: translate('dashboard.keywords'),
    },
  });
}
