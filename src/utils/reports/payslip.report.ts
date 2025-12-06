import type { Content } from 'pdfmake/interfaces';
import { formatDateTime } from '../format.util';
import { defaultDocumentConfig, defaultStyles, createGetMotoHeader, COMPANY_INFO } from '../pdf.util';
import { loadLogoAsBase64 } from '../logo-base64';
import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

/**
 * Interface para dados do holerite
 */
export interface PayslipData {
  paymentId: number;
  employee: {
    name: string;
    jobTitle: string;
    employeeId: number;
  };
  period: {
    start: string;
    end: string;
  };
  paymentDate: string;
  hours: {
    regular: number;
    overtime: number;
    total: number;
  };
  rates: {
    hourly: number; // em pence
    overtimeMultiplier?: number;
  };
  amounts: {
    gross: number; // em pence
    deductions: number; // em pence
    net: number; // em pence
  };
  notes?: string;
  t?: (key: string) => string;
}

/**
 * Formata valores em pence para pounds em string
 */
function formatUKCurrency(pence: number): string {
  const pounds = pence / 100;
  return `£${pounds.toFixed(2)}`;
}

/**
 * Formata data no padrão DD/MM/YYYY
 */
function formatDate(date: string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Cria seção de informações do funcionário
 */
function createEmployeeSection(data: PayslipData, t: (key: string) => string): Content[] {
  return [
    { text: t('payroll.employeeInformation'), style: 'subheader', marginTop: 20 },
    {
      table: {
        widths: ['30%', '70%'],
        body: [
          [
            { text: t('payroll.employee'), style: 'tableLabel' },
            { text: data.employee.name, bold: true }
          ],
          [
            { text: t('employees.jobTitle'), style: 'tableLabel' },
            { text: data.employee.jobTitle }
          ],
          [
            { text: t('employees.employeeId'), style: 'tableLabel' },
            { text: data.employee.employeeId.toString() }
          ],
        ]
      },
      layout: 'lightHorizontalLines'
    }
  ];
}

/**
 * Cria seção de período e pagamento
 */
function createPaymentPeriodSection(data: PayslipData, t: (key: string) => string): Content[] {
  return [
    { text: t('payroll.paymentPeriod'), style: 'subheader', marginTop: 20 },
    {
      table: {
        widths: ['30%', '70%'],
        body: [
          [
            { text: t('payroll.payPeriod'), style: 'tableLabel' },
            { text: `${formatDate(data.period.start)} - ${formatDate(data.period.end)}` }
          ],
          [
            { text: t('payroll.paymentDate'), style: 'tableLabel' },
            { text: formatDate(data.paymentDate), bold: true }
          ],
        ]
      },
      layout: 'lightHorizontalLines'
    }
  ];
}

/**
 * Cria seção de horas trabalhadas
 */
function createHoursSection(data: PayslipData, t: (key: string) => string): Content[] {
  return [
    { text: t('payroll.hoursWorked'), style: 'subheader', marginTop: 20 },
    {
      table: {
        widths: ['40%', '30%', '30%'],
        body: [
          [
            { text: t('payroll.description'), style: 'tableHeader', fillColor: '#f0f0f0' },
            { text: t('payroll.hours'), style: 'tableHeader', fillColor: '#f0f0f0', alignment: 'center' },
            { text: t('payroll.rate'), style: 'tableHeader', fillColor: '#f0f0f0', alignment: 'right' },
          ],
          [
            { text: t('payroll.regularHours') },
            { text: `${data.hours.regular.toFixed(2)} hrs`, alignment: 'center' },
            { text: formatUKCurrency(data.rates.hourly) + '/hr', alignment: 'right' },
          ],
          [
            { text: t('payroll.overtimeHours') },
            { text: `${data.hours.overtime.toFixed(2)} hrs`, alignment: 'center' },
            { text: formatUKCurrency(data.rates.hourly) + '/hr', alignment: 'right' },
          ],
          [
            { text: t('payroll.totalHours'), bold: true },
            { text: `${data.hours.total.toFixed(2)} hrs`, bold: true, alignment: 'center' },
            { text: '', alignment: 'right' },
          ],
        ]
      },
      layout: {
        hLineWidth: (i: number) => (i === 0 || i === 1 || i === 4) ? 1 : 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
      }
    }
  ];
}

/**
 * Cria seção de valores
 */
function createAmountsSection(data: PayslipData, t: (key: string) => string): Content[] {
  return [
    { text: t('payroll.paymentSummary'), style: 'subheader', marginTop: 20 },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          [
            { text: t('payroll.grossAmount'), style: 'tableLabel' },
            { text: formatUKCurrency(data.amounts.gross), alignment: 'right', bold: true }
          ],
          [
            { text: t('payroll.deductions'), style: 'tableLabel' },
            { text: `- ${formatUKCurrency(data.amounts.deductions)}`, alignment: 'right', color: '#ff4d4f' }
          ],
          [
            { text: t('payroll.netAmountToPay'), bold: true, fontSize: 12 },
            { 
              text: formatUKCurrency(data.amounts.net), 
              alignment: 'right', 
              bold: true, 
              fontSize: 14,
              color: '#52c41a' 
            }
          ],
        ]
      },
      layout: {
        hLineWidth: (i: number) => (i === 0 || i === 3) ? 1 : 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
        fillColor: (i: number) => (i === 2) ? '#f6ffed' : null,
      }
    }
  ];
}

/**
 * Cria rodapé do holerite
 */
function createPayslipFooter(data: PayslipData, t: (key: string) => string): Content[] {
  return [
    { 
      text: `${t('payroll.payslipNumber')}: #${data.paymentId}`,
      style: 'small',
      color: '#999',
      marginTop: 30
    },
    {
      text: `${t('common.generatedAt')}: ${formatDateTime(new Date().toISOString())}`,
      style: 'small',
      color: '#999'
    },
    ...(data.notes ? [{
      text: `${t('common.notes')}: ${data.notes}`,
      style: 'small',
      color: '#666',
      marginTop: 10,
      italics: true
    }] : [])
  ];
}

/**
 * Gera PDF do holerite
 */
export async function generatePayslipPDF(data: PayslipData): Promise<void> {
  const t = data.t || ((key: string) => key);
  const logoBase64 = await loadLogoAsBase64();

  const content: Content[] = [
    createGetMotoHeader(logoBase64),
    
    // Título do documento
    {
      text: t('payroll.payslip'),
      style: 'header',
      alignment: 'center',
      margin: [0, 10, 0, 20] as [number, number, number, number]
    },

    ...createEmployeeSection(data, t),
    ...createPaymentPeriodSection(data, t),
    ...createHoursSection(data, t),
    ...createAmountsSection(data, t),
    ...createPayslipFooter(data, t),
  ];

  const docDefinition = {
    ...defaultDocumentConfig,
    content,
    styles: {
      ...defaultStyles,
      tableLabel: {
        color: '#666',
        fontSize: 10
      },
      small: {
        fontSize: 8
      }
    }
  };

  pdfMake.createPdf(docDefinition).download(`holerite_${data.employee.name.replace(/\s+/g, '_')}_${formatDate(data.paymentDate)}.pdf`);
}
