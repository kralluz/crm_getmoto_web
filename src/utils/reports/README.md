# Sistema de Relatórios - GetMoto LTD.

Sistema de geração de relatórios em PDF usando **pdfmake**, substituindo a implementação anterior baseada em html2canvas + jsPDF.

## ✨ Vantagens do pdfmake

- ✅ **PDF Vetorial**: Texto selecionável e pesquisável
- ✅ **Tamanho Menor**: Arquivos mais leves
- ✅ **Melhor Qualidade**: Não perde resolução ao dar zoom
- ✅ **Acessibilidade**: Compatível com screen readers
- ✅ **Performance**: Geração mais rápida
- ✅ **Flexibilidade**: Fácil customização de layouts

## 📋 Relatórios Disponíveis

### 1. Ordem de Serviço (service-order.report.ts)

Relatório detalhado de uma ordem de serviço específica.

**Uso:**
```typescript
import { generateServiceOrderReport } from '@/utils/reports';

// No componente
const handleGeneratePdf = () => {
  generateServiceOrderReport(serviceOrder);
};
```

**Conteúdo:**
- Informações da OS (número, data, status, cliente, profissional)
- Dados do veículo (marca, modelo, placa, ano, cor)
- Descrição do serviço e diagnóstico
- Produtos utilizados (tabela)
- Serviços realizados (tabela)
- Resumo financeiro com totais

### 2. Fluxo de Caixa (cashflow.report.ts)

Demonstrativo financeiro de entradas e saídas por período.

**Uso:**
```typescript
import { generateCashFlowReport } from '@/utils/reports';
import type { CashFlowReportData } from '@/utils/reports';

const data: CashFlowReportData = {
  entries: cashFlowEntries,
  summary: {
    totalIncome: 5000,
    totalExpense: 3000,
    balance: 2000
  },
  categorySummary: [
    { category: 'Serviços', type: 'INCOME', total: 3000, count: 10 },
    { category: 'Compras', type: 'EXPENSE', total: 2000, count: 5 }
  ],
  startDate: '2024-01-01',
  endDate: '2024-01-31'
};

generateCashFlowReport(data);
```

**Conteúdo:**
- Resumo geral (entradas, saídas, saldo)
- Resumo por categoria
- Listagem detalhada de transações

### 3. Alerta de Estoque Baixo (low-stock.report.ts)

Lista de produtos que precisam reposição urgente.

**Uso:**
```typescript
import { generateLowStockReport } from '@/utils/reports';
import type { LowStockReportData } from '@/utils/reports';

const data: LowStockReportData = {
  products: lowStockProducts
};

generateLowStockReport(data);
```

**Conteúdo:**
- Resumo (quantidade de produtos em falta, valor estimado)
- Tabela de produtos com status (CRÍTICO, ATENÇÃO, ZERADO)
- Quantidade atual, mínima e a comprar
- Preço unitário e custo total de reposição
- Legenda de status

## 🛠️ Utilitários Base

### pdf.util.ts

Utilitário centralizado para geração de PDFs com pdfmake.

**Funções principais:**

```typescript
// Gerar PDF e fazer download
generatePdf(content, fileName, config);

// Abrir PDF em nova aba
openPdf(content, config);

// Obter PDF como Blob
const blob = await getPdfBlob(content, config);

// Criar cabeçalho padrão
const header = createHeader({
  title: 'Título do Relatório',
  subtitle: 'Subtítulo opcional',
  showDate: true,
  customInfo: ['Info 1', 'Info 2']
});

// Criar rodapé com numeração
const footer = createFooter(currentPage, pageCount);
```

**Configurações disponíveis:**

```typescript
interface Config {
  styles?: StyleDictionary;        // Estilos customizados
  header?: HeaderConfig;            // Configuração do cabeçalho
  info?: DocumentInfo;              // Metadados do PDF
  pageOrientation?: 'portrait' | 'landscape'; // Orientação
}
```

### format.util.ts

Utilitário de formatação de dados.

**Funções disponíveis:**

```typescript
// Converte Decimal do Prisma para número
const num = parseDecimal(value);

// Formata para moeda (£)
const formatted = formatCurrency(value);

// Formata data/hora
const dateTime = formatDateTime(date, 'DD/MM/YYYY HH:mm');
const dateOnly = formatDate(date);
const timeOnly = formatTime(date);

// Formata número com decimais
const number = formatNumber(value, 2);

// Formata percentual
const percent = formatPercent(value, 2);
```

## 🎨 Estilos Padrão

Os relatórios utilizam estilos padrão definidos em `pdf.util.ts`:

```typescript
{
  header: { fontSize: 18, bold: true, color: '#1890ff' },
  subheader: { fontSize: 14, bold: true },
  tableHeader: { bold: true, fontSize: 11, color: 'white', fillColor: '#1890ff' },
  tableCell: { fontSize: 9 },
  footer: { fontSize: 8, italics: true, color: '#666' },
  info: { fontSize: 10 },
  label: { fontSize: 9, bold: true, color: '#666' },
  value: { fontSize: 10 },
  totalLabel: { fontSize: 11, bold: true },
  totalValue: { fontSize: 11, bold: true, color: '#52c41a' }
}
```

## 📊 Criando Novos Relatórios

### Passo 1: Criar arquivo do relatório

Crie um novo arquivo em `src/utils/reports/nome-relatorio.report.ts`:

```typescript
import type { Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDateTime } from '../format.util';
import { generatePdf } from '../pdf.util';

// Interface dos dados
export interface MeuRelatorioData {
  // ... definir estrutura
}

// Função para gerar seção
function createMinhaSecao(data: MeuRelatorioData): Content {
  return [
    { text: 'Título da Seção', style: 'subheader' },
    {
      table: {
        widths: ['*', '30%'],
        body: [
          [
            { text: 'Label:', style: 'label' },
            { text: 'Valor', style: 'value' }
          ]
        ]
      },
      layout: 'noBorders'
    }
  ];
}

// Função principal de geração
export function generateMeuRelatorio(data: MeuRelatorioData): void {
  const content: Content = [
    ...createMinhaSecao(data),
    // ... outras seções
  ];

  generatePdf(content, `meu_relatorio_${new Date().getTime()}.pdf`, {
    header: {
      title: 'Meu Relatório',
      subtitle: 'Descrição'
    },
    info: {
      title: 'Meu Relatório',
      subject: 'Assunto - GetMoto LTD.',
      keywords: 'palavras, chave'
    }
  });
}
```

### Passo 2: Exportar no index.ts

Adicione a exportação em `src/utils/reports/index.ts`:

```typescript
export { generateMeuRelatorio } from './meu-relatorio.report';
export type { MeuRelatorioData } from './meu-relatorio.report';
```

### Passo 3: Usar no componente

```typescript
import { generateMeuRelatorio } from '@/utils/reports';

const handleGerarRelatorio = () => {
  generateMeuRelatorio(meusDados);
};
```

## 📚 Recursos do pdfmake

### Tabelas

```typescript
{
  table: {
    headerRows: 1,
    widths: ['*', '20%', '30%'], // *, auto, ou valor fixo
    body: [
      [
        { text: 'Coluna 1', style: 'tableHeader' },
        { text: 'Coluna 2', style: 'tableHeader' }
      ],
      ['Célula 1', 'Célula 2'],
      ['Célula 3', 'Célula 4']
    ]
  },
  layout: {
    fillColor: (rowIndex) => (rowIndex % 2 === 0 ? '#f0f0f0' : null),
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#d9d9d9',
    vLineColor: () => '#d9d9d9'
  }
}
```

### Listas

```typescript
// Lista não ordenada
{ ul: ['Item 1', 'Item 2', 'Item 3'] }

// Lista ordenada
{ ol: ['Item 1', 'Item 2', 'Item 3'] }
```

### Colunas

```typescript
{
  columns: [
    { text: 'Coluna 1', width: '*' },
    { text: 'Coluna 2', width: 'auto' },
    { text: 'Coluna 3', width: 100 }
  ]
}
```

### Imagens

```typescript
{
  image: 'data:image/png;base64,...',
  width: 150,
  height: 150
}
```

## 🔧 Troubleshooting

### Erro: "Cannot find module 'pdfmake'"

Instale a dependência:
```bash
npm install pdfmake
```

### Erro: "vfs_fonts not found"

Verifique se está importando corretamente:
```typescript
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
```

### PDF não abre ou está corrompido

- Verifique se todos os `Content` retornam arrays válidos
- Certifique-se de que as larguras das colunas somam 100% ou usam valores válidos
- Valide que não há objetos `undefined` ou `null` no conteúdo

### Caracteres especiais não aparecem

pdfmake usa fontes embutidas. Para caracteres especiais, pode ser necessário configurar fontes customizadas.

## 📖 Documentação Oficial

- [pdfmake GitHub](https://github.com/bpampuch/pdfmake)
- [pdfmake Playground](http://pdfmake.org/playground.html)
- [Documentação de API](https://pdfmake.github.io/docs/0.1/)

## 🚀 Próximos Passos

Relatórios sugeridos para implementação futura:

1. **Produtos em Estoque** - Inventário completo
2. **Movimentações de Estoque** - Histórico de entradas/saídas
3. **OS Consolidado** - Resumo de todas as OS em um período
4. **Serviços Mais Realizados** - Ranking de serviços
5. **Produtos Mais Vendidos** - Análise de vendas
6. **Veículos Cadastrados** - Lista de veículos com histórico
7. **Produtividade por Funcionário** - Performance da equipe

Ver priorização completa no documento de análise inicial.
