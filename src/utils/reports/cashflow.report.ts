import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDateTime } from '../format.util';
import { defaultDocumentConfig, defaultStyles, createGetMotoHeader, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

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
            { text: t('dashboard.totalIncomeLabel'), style: 'label', alignment: 'right', border: [true, true, true, true] },
            {
              text: formatCurrency(summary.totalIncome),
              style: 'value',
              alignment: 'right',
              bold: true,
              border: [true, true, true, true],
            },
          ],
          [
            { text: t('dashboard.totalExpenseLabel'), style: 'label', alignment: 'right', border: [true, true, true, true] },
            {
              text: formatCurrency(summary.totalExpense),
              style: 'value',
              alignment: 'right',
              bold: true,
              border: [true, true, true, true],
            },
          ],
          [
            { text: t('dashboard.balanceLabel'), style: 'totalLabel', alignment: 'right', border: [true, true, true, true] },
            {
              text: formatCurrency(summary.balance),
              style: 'totalValue',
              alignment: 'right',
              bold: true,
              fontSize: 12,
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
 * Cria seção de resumo por categoria
 */
function createCategorySummarySection(categorySummary: CategorySummary[], t: (key: string) => string): Content {
  if (!categorySummary || categorySummary.length === 0) {
    return [];
  }

  const rows = categorySummary.map((item) => [
    { text: item.category, style: 'tableCell', border: [true, true, true, true] },
    {
      text: item.type === 'INCOME' ? t('dashboard.income') : t('dashboard.expense'),
      style: 'tableCell',
      alignment: 'center',
      border: [true, true, true, true],
    },
    { text: item.count.toString(), style: 'tableCell', alignment: 'center', border: [true, true, true, true] },
    {
      text: formatCurrency(item.total),
      style: 'tableCell',
      alignment: 'right',
      bold: true,
      border: [true, true, true, true],
    },
  ]);

  return [
    { text: t('dashboard.categoryBreakdown'), style: 'subheader' },
    // @ts-expect-error - pdfmake type compatibility issue
    {
      table: {
        headerRows: 1,
        widths: ['*', '20%', '15%', '25%'],
        body: [
          [
            { text: t('dashboard.category'), style: 'tableHeader', border: [true, true, true, true] },
            { text: t('dashboard.type'), style: 'tableHeader', border: [true, true, true, true] },
            { text: t('dashboard.quantity'), style: 'tableHeader', border: [true, true, true, true] },
            { text: t('dashboard.total'), style: 'tableHeader', border: [true, true, true, true] },
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
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

/**
 * Cria seção de listagem de transações
 */
function createEntriesSection(entries: CashFlowEntry[], t: (key: string) => string): Content {
  if (!entries || entries.length === 0) {
    return [
      { text: t('dashboard.transactions'), style: 'subheader' },
      { text: t('dashboard.noTransactionsFound'), style: 'info' },
    ];
  }

  const rows = entries.map((entry) => {
    // Verifica se a transação é cancelada (ESTORNO)
    const isCancelled = entry.note?.toUpperCase().includes('ESTORNO') || false;

    return [
      { 
        text: formatDateTime(entry.occurred_at), 
        style: 'tableCell', 
        fontSize: 8, 
        border: [true, true, true, true],
        decoration: isCancelled ? 'lineThrough' : undefined,
      },
      {
        text: entry.direction === 'entrada' ? t('dashboard.income') : t('dashboard.expense'),
        style: 'tableCell',
        alignment: 'center',
        bold: true,
        border: [true, true, true, true],
        decoration: isCancelled ? 'lineThrough' : undefined,
      },
      {
        text: formatCurrency(entry.amount),
        style: 'tableCell',
        alignment: 'right',
        bold: true,
        border: [true, true, true, true],
        decoration: isCancelled ? 'lineThrough' : undefined,
      },
      { 
        text: entry.note || '-', 
        style: 'tableCell', 
        fontSize: 8, 
        border: [true, true, true, true],
        decoration: isCancelled ? 'lineThrough' : undefined,
      },
    ];
  });

  return [
    { text: t('dashboard.transactionDetails'), style: 'subheader' },
    // @ts-expect-error - pdfmake type compatibility issue
    {
      table: {
        headerRows: 1,
        widths: ['18%', '15%', '20%', '*'],
        body: [
          [
            { text: t('dashboard.date'), style: 'tableHeader', border: [true, true, true, true] },
            { text: t('dashboard.type'), style: 'tableHeader', border: [true, true, true, true] },
            { text: t('dashboard.value'), style: 'tableHeader', border: [true, true, true, true] },
            { text: t('dashboard.description'), style: 'tableHeader', border: [true, true, true, true] },
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
 * Gera o relatório de Fluxo de Caixa em PDF
 */
export async function generateCashFlowReport(data: CashFlowReportData): Promise<void> {
  const { entries, summary, categorySummary, startDate, endDate, t } = data;

  // Função de tradução padrão (português) se não fornecida
  const translate = t || ((key: string) => {
    const translations: Record<string, string> = {
      'dashboard.generalSummary': 'General Summary',
      'dashboard.totalIncomeLabel': 'Total Income:',
      'dashboard.totalExpenseLabel': 'Total Expenses:',
      'dashboard.balanceLabel': 'BALANCE:',
      'dashboard.categoryBreakdown': 'Category Breakdown',
      'dashboard.category': 'Category',
      'dashboard.type': 'Type',
      'dashboard.quantity': 'Qty',
      'dashboard.total': 'Total',
      'dashboard.income': 'Income',
      'dashboard.expense': 'Expense',
      'dashboard.transactions': 'Transactions',
      'dashboard.noTransactionsFound': 'No transactions found in the selected period.',
      'dashboard.transactionDetails': 'Transaction Details',
      'dashboard.date': 'Date',
      'dashboard.value': 'Value',
      'dashboard.description': 'Description',
      'dashboard.period': 'Period',
      'dashboard.from': 'From',
      'dashboard.until': 'Until',
      'dashboard.cashFlowReport': 'Cash Flow Report',
      'dashboard.financialStatement': 'Financial Statement - GetMoto',
      'dashboard.keywords': 'cash flow, financial, income, expenses',
    };
    return translations[key] || key;
  });

  // Carregar logo
  const logoBase64 = await loadLogoAsBase64();

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
    createGetMotoHeader(logoBase64),
    { text: translate('dashboard.cashFlowReport'), style: 'header', alignment: 'center', margin: [0, 0, 0, 10] as [number, number, number, number] },
  ];

  if (periodInfo.length > 0) {
    content.push({ text: periodInfo[0], style: 'info', alignment: 'center', margin: [0, 0, 0, 20] as [number, number, number, number] });
  }

  content.push(...(createSummarySection(summary, translate) as any[]));
  content.push(...(createCategorySummarySection(categorySummary || [], translate) as any[]));
  content.push(...(createEntriesSection(entries, translate) as any[]));

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
  content.push({
    columns: [
      {
        text: `REPORT DATE ${new Date().toLocaleDateString('en-GB')}`,
        bold: true,
        fontSize: 9,
        width: '100%',
        alignment: 'center',
      },
    ],
    margin: [0, 0, 0, 0] as [number, number, number, number],
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
      title: translate('dashboard.cashFlowReport'),
      author: COMPANY_INFO.name,
      subject: translate('dashboard.financialStatement'),
      keywords: translate('dashboard.keywords'),
      creator: COMPANY_INFO.name,
      producer: 'pdfmake',
    },
  };

  pdfMake.createPdf(docDefinition).download(`cashflow_report_${new Date().getTime()}.pdf`);
}
