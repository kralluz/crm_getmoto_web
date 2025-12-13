import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDate } from '../format.util';
import { defaultDocumentConfig, defaultStyles, createGetMotoHeader, createGetMotoFooter, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

/**
 * Interface para dados da despesa
 */
export interface ExpenseData {
  expense_id: number | string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes?: string;
  created_at: string;
  is_active: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
}

/**
 * Interface para traduções
 */
export interface ExpenseTranslations {
  title: string;
  expenseNumber: string;
  category: string;
  description: string;
  amount: string;
  expenseDate: string;
  status: string;
  active: string;
  cancelled: string;
  notes: string;
  cancelledAt: string;
  cancellationReason: string;
  createdAt: string;
  cashImpact: string;
  thankYou: string;
}

/**
 * Cria seção de informações gerais
 */
function createInfoSection(data: ExpenseData, t: ExpenseTranslations): Content {
  return {
    table: {
      widths: ['35%', '*'],
      body: [
        [
          { text: t.category, style: 'label', border: [true, true, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: data.category, style: 'value', border: [false, true, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
        ],
        [
          { text: t.description, style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: data.description, style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
        ],
        [
          { text: t.expenseDate, style: 'label', border: [true, false, false, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
          { text: formatDate(data.expense_date), style: 'value', border: [false, false, true, false], margin: [5, 4, 5, 4] as [number, number, number, number] },
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
 * Cria seção de valor
 */
function createAmountSection(data: ExpenseData, t: ExpenseTranslations): Content[] {
  return [
    { text: t.amount, style: 'subheader' },
    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: formatCurrency(data.amount),
              style: 'totalValue',
              alignment: 'center',
              fontSize: 20,
              bold: true,
              color: '#ff4d4f',
              margin: [10, 15, 10, 15] as [number, number, number, number],
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
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },
  ];
}

/**
 * Cria seção de observações
 */
function createNotesSection(data: ExpenseData, t: ExpenseTranslations): Content[] {
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
function createCancellationSection(data: ExpenseData, t: ExpenseTranslations): Content[] {
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
 * Gera PDF da despesa
 */
export async function generateExpensePDF(
  data: ExpenseData,
  translations: ExpenseTranslations
): Promise<void> {
  const logoBase64 = await loadLogoAsBase64();

  const docDefinition: any = {
    ...defaultDocumentConfig,
    header: createGetMotoHeader(logoBase64),
    footer: createGetMotoFooter(),
    content: [
      // Título e número da despesa
      {
        columns: [
          { text: translations.title, style: 'header' },
          { text: `${translations.expenseNumber}: #${data.expense_id}`, style: 'header', alignment: 'right' },
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // Informações gerais
      createInfoSection(data, translations),

      // Seção de cancelamento (se aplicável)
      ...createCancellationSection(data, translations),

      // Valor
      ...createAmountSection(data, translations),

      // Observações
      ...createNotesSection(data, translations),

      // Nota sobre impacto no caixa
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: translations.cashImpact,
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

  pdfMake.createPdf(docDefinition).download(`despesa-${data.expense_id}.pdf`);
}
