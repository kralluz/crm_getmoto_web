import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';
import { formatDateTime } from './format.util';

// Configurar fontes do pdfMake
(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

/**
 * Configuração padrão de estilos para todos os relatórios
 */
export const defaultStyles: StyleDictionary = {
  header: {
    fontSize: 18,
    bold: true,
    margin: [0, 0, 0, 10] as [number, number, number, number],
    color: '#1890ff',
  },
  subheader: {
    fontSize: 14,
    bold: true,
    margin: [0, 10, 0, 5] as [number, number, number, number],
  },
  tableHeader: {
    bold: true,
    fontSize: 11,
    color: 'white',
    fillColor: '#1890ff',
    alignment: 'center',
  },
  tableCell: {
    fontSize: 9,
    margin: [0, 2, 0, 2] as [number, number, number, number],
  },
  footer: {
    fontSize: 8,
    italics: true,
    color: '#666',
  },
  info: {
    fontSize: 10,
    margin: [0, 2, 0, 2] as [number, number, number, number],
  },
  label: {
    fontSize: 9,
    bold: true,
    color: '#666',
  },
  value: {
    fontSize: 10,
  },
  totalLabel: {
    fontSize: 11,
    bold: true,
  },
  totalValue: {
    fontSize: 11,
    bold: true,
    color: '#52c41a',
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
 * Configuração padrão do documento
 */
export const defaultDocumentConfig = {
  pageSize: 'A4' as const,
  pageOrientation: 'portrait' as const,
  pageMargins: [40, 60, 40, 60] as [number, number, number, number],
};

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
