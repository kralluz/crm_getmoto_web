import pdfMakeOriginal from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';
import { formatDateTime } from './format.util';

// Configurar fontes do pdfMake
const pdfMake = pdfMakeOriginal as any;
pdfMake.vfs = pdfFonts;

/**
 * Informações da empresa GetMoto
 */
export const COMPANY_INFO = {
  name: 'GetMoto Ltd.',
  tagline: 'Rent & Repair',
  address: {
    street: '223 Selbourne Road',
    city: 'Luton',
    postcode: 'LU4 8NP',
  },
  contact: {
    email: 'Getmotoltduk@gmail.com',
    phone: '07749818987',
  },
  registration: {
    number: '14947306',
  },
  bank: {
    name: 'Getmoto Ltd.',
    sortCode: '30-99-50',
    accountNo: '76080168',
  },
};

/**
 * Configuração padrão de estilos para todos os relatórios (padrão GetMoto)
 */
export const defaultStyles: StyleDictionary = {
  header: {
    fontSize: 14,
    bold: true,
    margin: [0, 0, 0, 5] as [number, number, number, number],
    color: '#000000',
  },
  subheader: {
    fontSize: 12,
    bold: true,
    margin: [0, 10, 0, 5] as [number, number, number, number],
    color: '#000000',
  },
  tableHeader: {
    bold: true,
    fontSize: 11,
    color: '#000000',
    fillColor: '#ffffff',
    alignment: 'center',
  },
  tableCell: {
    fontSize: 8,
    margin: [2, 3, 2, 3] as [number, number, number, number],
    color: '#000000',
  },
  footer: {
    fontSize: 8,
    color: '#000000',
  },
  info: {
    fontSize: 9,
    margin: [0, 2, 0, 2] as [number, number, number, number],
    color: '#000000',
  },
  label: {
    fontSize: 10,
    bold: true,
    color: '#000000',
  },
  value: {
    fontSize: 10,
    color: '#000000',
  },
  totalLabel: {
    fontSize: 11,
    bold: true,
    color: '#000000',
  },
  totalValue: {
    fontSize: 11,
    bold: true,
    color: '#000000',
  },
  companyName: {
    fontSize: 24,
    bold: true,
    color: '#000000',
  },
  companyTagline: {
    fontSize: 10,
    color: '#1890ff',
    italics: true,
  },
  companyInfo: {
    fontSize: 9,
    color: '#000000',
  },
};

/**
 * Interface para configuração do cabeçalho
 */
export interface HeaderConfig {
  title: string;
  subtitle?: string;
  showDate?: boolean;
  customInfo?: string[];
}

/**
 * Cria cabeçalho padrão para relatórios
 */
export function createHeader(config: HeaderConfig): Content {
  const { title, subtitle, showDate = true, customInfo = [] } = config;

  const content: Content[] = [
    { text: 'CRM GetMoto', style: 'header', alignment: 'center' },
    { text: title, style: 'subheader', alignment: 'center' },
  ];

  if (subtitle) {
    content.push({ text: subtitle, style: 'info', alignment: 'center', margin: [0, 0, 0, 5] });
  }

  if (showDate) {
    content.push({
      text: `Gerado em: ${formatDateTime(new Date())}`,
      style: 'info',
      alignment: 'center',
      margin: [0, 0, 0, 10],
    });
  }

  if (customInfo.length > 0) {
    customInfo.forEach((info) => {
      content.push({ text: info, style: 'info', alignment: 'center' });
    });
    content.push({ text: '', margin: [0, 0, 0, 10] });
  }

  return content;
}

/**
 * Cria rodapé padrão com numeração de páginas
 */
export function createFooter(currentPage: number, pageCount: number): Content {
  return {
    text: `Página ${currentPage} de ${pageCount}`,
    alignment: 'center',
    style: 'footer',
    margin: [0, 10, 0, 0] as [number, number, number, number],
  };
}

/**
 * Cria cabeçalho no padrão GetMoto (invoice style)
 * @param logoBase64 - Logo em formato base64 (opcional)
 */
export function createGetMotoHeader(logoBase64?: string): Content {
  return {
    columns: [
      {
        // Logo (lado esquerdo)
        width: '55%',
        stack: logoBase64 ? [
          {
            image: logoBase64,
            fit: [300, 100],
            margin: [-10, -15, 0, 0] as [number, number, number, number],
          },
        ] : [
          { text: 'GetMOTO', style: 'companyName', bold: true, fontSize: 28 },
          { text: 'Rent & Repair', style: 'companyTagline', fontSize: 9, margin: [0, 0, 0, 10] as [number, number, number, number] },
        ],
      },
      {
        // Informações de contato (lado direito)
        width: '45%',
        stack: [
          { text: COMPANY_INFO.address.street, style: 'companyInfo', alignment: 'right' },
          { text: COMPANY_INFO.address.city, style: 'companyInfo', alignment: 'right' },
          { text: COMPANY_INFO.address.postcode, style: 'companyInfo', alignment: 'right' },
          {
            text: COMPANY_INFO.contact.email,
            style: 'companyInfo',
            alignment: 'right',
            color: '#1890ff',
            decoration: 'underline'
          },
          { text: COMPANY_INFO.contact.phone, style: 'companyInfo', alignment: 'right' },
        ],
      },
    ],
    margin: [0, 0, 0, 20] as [number, number, number, number],
  };
}

/**
 * Cria rodapé no padrão GetMoto com informações da empresa
 */
export function createGetMotoFooter(invoiceNumber?: string, date?: string): any {
  return (currentPage: number, pageCount: number) => {
    return {
      stack: [
        // Espaçamento do topo
        { text: '', margin: [0, 0, 0, 0] },

        // Tabela com informações da empresa
        {
          table: {
            widths: ['*'],
            body: [
              // Linha 1: Mensagens de contato
              [
                {
                  columns: [
                    {
                      text: 'If you have any questions concerning this invoice, Please contact us.',
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
              // Linha 2: Registro da empresa
              [
                {
                  text: `Company Registration No. ${COMPANY_INFO.registration.number}`,
                  alignment: 'center',
                  bold: true,
                  fontSize: 8,
                  margin: [4, 4, 4, 4] as [number, number, number, number],
                },
              ],
              // Linha 3: Detalhes bancários
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
          margin: [0, 0, 0, 8] as [number, number, number, number],
        },

        // Invoice number e data (fora da tabela)
        {
          columns: [
            {
              text: invoiceNumber ? `INVOICE ${invoiceNumber}` : '',
              bold: true,
              fontSize: 9,
              width: '50%',
            },
            {
              text: date ? `DATE ${date}` : '',
              bold: true,
              fontSize: 9,
              width: '50%',
              alignment: 'right',
            },
          ],
          margin: [0, 0, 0, 30] as [number, number, number, number],
        },
      ],
      margin: [0, 0, 0, 0] as [number, number, number, number],
    };
  };
}

/**
 * Configuração padrão do documento
 */
export const defaultDocumentConfig = {
  pageSize: 'A4' as const,
  pageOrientation: 'portrait' as const,
  pageMargins: [50, 60, 50, 60] as [number, number, number, number],
};

/**
 * Cria moldura com bordas laterais para todo o conteúdo
 */
export function createPageWithBorders(content: Content): Content {
  return {
    canvas: [
      // Borda esquerda
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 750,
        lineWidth: 1,
        lineColor: '#000000',
      },
      // Borda direita
      {
        type: 'line',
        x1: 495,
        y1: 0,
        x2: 495,
        y2: 750,
        lineWidth: 1,
        lineColor: '#000000',
      },
    ],
  };
}

/**
 * Interface para informações do documento
 */
export interface DocumentInfo {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

/**
 * Cria e faz download de um PDF
 */
export function generatePdf(
  content: Content,
  fileName: string,
  config?: {
    styles?: StyleDictionary;
    header?: HeaderConfig;
    info?: DocumentInfo;
    pageOrientation?: 'portrait' | 'landscape';
  }
): void {
  const { styles, header, info, pageOrientation = 'portrait' } = config || {};

  const docDefinition: TDocumentDefinitions = {
    ...defaultDocumentConfig,
    pageOrientation,
    content: header ? [createHeader(header), content] : content,
    styles: { ...defaultStyles, ...styles },
    footer: createFooter,
    info: info
      ? {
          title: info.title,
          author: info.author || 'CRM GetMoto',
          subject: info.subject,
          keywords: info.keywords,
          creator: 'CRM GetMoto',
          producer: 'pdfmake',
        }
      : undefined,
  };

  pdfMake.createPdf(docDefinition).download(fileName);
}

/**
 * Abre o PDF em uma nova aba ao invés de fazer download
 */
export function openPdf(
  content: Content,
  config?: {
    styles?: StyleDictionary;
    header?: HeaderConfig;
    info?: DocumentInfo;
    pageOrientation?: 'portrait' | 'landscape';
  }
): void {
  const { styles, header, info, pageOrientation = 'portrait' } = config || {};

  const docDefinition: TDocumentDefinitions = {
    ...defaultDocumentConfig,
    pageOrientation,
    content: header ? [createHeader(header), content] : content,
    styles: { ...defaultStyles, ...styles },
    footer: createFooter,
    info: info
      ? {
          title: info.title,
          author: info.author || 'CRM GetMoto',
          subject: info.subject,
          keywords: info.keywords,
          creator: 'CRM GetMoto',
          producer: 'pdfmake',
        }
      : undefined,
  };

  pdfMake.createPdf(docDefinition).open();
}

/**
 * Retorna o PDF como Blob para manipulação customizada
 */
export function getPdfBlob(
  content: Content,
  config?: {
    styles?: StyleDictionary;
    header?: HeaderConfig;
    info?: DocumentInfo;
    pageOrientation?: 'portrait' | 'landscape';
  }
): Promise<Blob> {
  return new Promise((resolve) => {
    const { styles, header, info, pageOrientation = 'portrait' } = config || {};

    const docDefinition: TDocumentDefinitions = {
      ...defaultDocumentConfig,
      pageOrientation,
      content: header ? [createHeader(header), content] : content,
      styles: { ...defaultStyles, ...styles },
      footer: createFooter,
      info: info
        ? {
            title: info.title,
            author: info.author || 'CRM GetMoto',
            subject: info.subject,
            keywords: info.keywords,
            creator: 'CRM GetMoto',
            producer: 'pdfmake',
          }
        : undefined,
    };

    pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
      resolve(blob);
    });
  });
}
