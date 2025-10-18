# Planejamento - Sistema Financeiro CRM GetMoto

## Análise do Backend

### Schema do Banco de Dados (Prisma)

#### Tabela: CashFlow (Fluxo de Caixa)
```prisma
model CashFlow {
  id              String          @id @default(uuid())
  paymentId       String?         @unique
  userId          String
  type            TransactionType  // INCOME | EXPENSE
  category        String
  amount          Decimal         @db.Decimal(10, 2)
  description     String
  date            DateTime        @default(now())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}
```

#### Enums Relacionados
- **TransactionType**: `INCOME` (entrada) | `EXPENSE` (saída)
- **PaymentMethod**: `CASH`, `CREDIT_CARD`, `DEBIT_CARD`, `PIX`, `BANK_TRANSFER`, `CHECK`
- **PaymentStatus**: `PENDING`, `PAID`, `OVERDUE`, `CANCELLED`

### APIs Disponíveis

#### CashFlow Endpoints
1. `POST /api/cashflow` - Criar transação
   - Campos: `userId`, `type`, `category`, `amount`, `description`, `date?`, `paymentId?`
   - Permissão: ADMIN, MANAGER

2. `GET /api/cashflow` - Listar transações
   - Query params: `type`, `category`, `startDate`, `endDate`
   - Retorna: Array de transações

3. `GET /api/cashflow/summary` - Resumo financeiro
   - Query params: `startDate?`, `endDate?`
   - Retorna: `{ totalIncome, totalExpense, balance }`

4. `GET /api/cashflow/summary/categories` - Resumo por categorias
   - Query params: `startDate?`, `endDate?`
   - Retorna: Array `[{ category, type, total, count }]`

5. `GET /api/cashflow/:id` - Buscar por ID
6. `PUT /api/cashflow/:id` - Atualizar (ADMIN, MANAGER)
7. `DELETE /api/cashflow/:id` - Deletar (ADMIN)

#### Product Endpoints
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Buscar produto

#### Service Endpoints
- `GET /api/services` - Listar serviços
- `GET /api/services/:id` - Buscar serviço

---

## 1. Tela: Dashboard / Visão Geral Financeira

### Objetivo
Fornecer uma visão rápida e clara da situação financeira do caixa, com:
- Saldo atual
- Entradas do período
- Saídas do período
- Gráfico de fluxo diário ou mensal

### Layout (Ant Design)

```
┌──────────────────────────────────────────────────────────────┐
│  Dashboard Financeiro                          [Filtro: Mês▼]│
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 💰 Saldo     │  │ ⬆️ Entradas   │  │ ⬇️ Saídas     │       │
│  │ R$ 45.850,00 │  │ R$ 68.200,00 │  │ R$ 22.350,00 │       │
│  │ ────────────  │  │ ────────────  │  │ ────────────  │       │
│  │ Total atual  │  │ Este mês     │  │ Este mês     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├──────────────────────────────────────────────────────────────┤
│  📊 Fluxo de Caixa (Últimos 30 dias)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [Gráfico de linha mostrando entradas e saídas]       │ │
│  │                                                        │ │
│  │  Legenda: ━━ Entradas  ━━ Saídas                      │ │
│  └────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  📂 Resumo por Categorias                                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Categoria         │ Entradas    │ Saídas      │ Total│ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 🔧 Serviços       │ R$ 45.000   │ -           │ +... │ │
│  │ 🛒 Venda Produtos │ R$ 18.500   │ -           │ +... │ │
│  │ 💵 Compras        │ -           │ R$ 12.000   │ -... │ │
│  │ 👥 Salários       │ -           │ R$ 8.500    │ -... │ │
│  └──────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  📋 Transações Recentes                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Data       │ Descrição           │ Categoria │ Valor  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ 17/10/2025 │ Troca de óleo       │ Serviço   │ +350  │ │
│  │ 17/10/2025 │ Venda pneu          │ Produto   │ +850  │ │
│  │ 16/10/2025 │ Compra peças        │ Compra    │ -450  │ │
│  └────────────────────────────────────────────────────────┘ │
│  [Ver todas as transações →]                                 │
└──────────────────────────────────────────────────────────────┘
```

### Componentes Ant Design Utilizados

1. **Cards com Statistic**
   - `<Card>` + `<Statistic>` para exibir saldo, entradas e saídas
   - Ícones: `DollarOutlined`, `ArrowUpOutlined`, `ArrowDownOutlined`
   - Cores: Verde para entradas, vermelho para saídas

2. **Gráfico**
   - Biblioteca: `@ant-design/charts` ou `recharts`
   - Tipo: LineChart ou AreaChart
   - Dados: API `/api/cashflow?startDate=...&endDate=...`

3. **Tabela de Categorias**
   - `<Table>` com colunas: categoria, entradas, saídas, total
   - Dados: API `/api/cashflow/summary/categories`

4. **Tabela de Transações Recentes**
   - `<Table>` com paginação
   - Dados: API `/api/cashflow` (limit: 10)
   - Badge/Tag para tipo (INCOME/EXPENSE)

5. **Filtro de Período**
   - `<DatePicker.RangePicker>` ou `<Select>` com opções:
     - Hoje, Última semana, Último mês, Últimos 3 meses, Personalizado

### Hooks/State Management

```typescript
// hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query';

export function useDashboardData(startDate?: string, endDate?: string) {
  // Buscar resumo financeiro
  const { data: summary } = useQuery({
    queryKey: ['cashflow', 'summary', startDate, endDate],
    queryFn: () => api.getCashFlowSummary({ startDate, endDate })
  });

  // Buscar transações
  const { data: transactions } = useQuery({
    queryKey: ['cashflow', 'list', startDate, endDate],
    queryFn: () => api.getCashFlows({ startDate, endDate })
  });

  // Buscar resumo por categorias
  const { data: categories } = useQuery({
    queryKey: ['cashflow', 'categories', startDate, endDate],
    queryFn: () => api.getCategorySummary({ startDate, endDate })
  });

  return { summary, transactions, categories };
}
```

### Funcionalidades

1. **Filtro de Período**
   - Dropdown ou DatePicker para selecionar período
   - Atualiza automaticamente todos os dados

2. **Cálculo de Saldo**
   - Saldo = Total Entradas - Total Saídas
   - Cor verde se positivo, vermelho se negativo

3. **Navegação**
   - Botão "Ver todas as transações" → redireciona para lista completa
   - Clicar em transação → abre modal com detalhes

---

## 2. Tela: Registrar Transação

### Objetivo
Permitir o registro rápido de entradas (INCOME) e saídas (EXPENSE) no fluxo de caixa, podendo ser relacionadas a serviços ou produtos.

### Layout (Ant Design)

```
┌──────────────────────────────────────────────────────────┐
│  Registrar Transação                                     │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Tipo de Transação *                                 │ │
│  │  ( ) Entrada (Receita)    ( ) Saída (Despesa)      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Categoria *                            [Dropdown ▼] │ │
│  │ ─────────────────────────────────────────────────── │ │
│  │ Opções:                                             │ │
│  │ - Serviço (apenas INCOME)                           │ │
│  │ - Venda de Produto (apenas INCOME)                  │ │
│  │ - Compra de Estoque (apenas EXPENSE)                │ │
│  │ - Salários (apenas EXPENSE)                         │ │
│  │ - Aluguel (apenas EXPENSE)                          │ │
│  │ - Outros                                            │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Valor * (R$)                                        │ │
│  │ [ 0,00                                           ]  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Descrição *                                         │ │
│  │ [                                                 ] │ │
│  │ Ex: Troca de óleo completa Moto XYZ                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Data *                                              │ │
│  │ [ 📅 17/10/2025                                  ]  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Vincular a: (opcional)                              │ │
│  │  [ ] Serviço      [Selecionar serviço ▼]           │ │
│  │  [ ] Produto      [Selecionar produto ▼]           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Observações                                         │ │
│  │ [                                                 ] │ │
│  │ [                                                 ] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  [ Cancelar ]                      [ ✓ Registrar ]       │
└──────────────────────────────────────────────────────────┘
```

### Componentes Ant Design Utilizados

1. **Radio Group** - Tipo de transação
   - `<Radio.Group>` com opções: Entrada / Saída
   - Muda dinamicamente as opções de categoria

2. **Select** - Categoria
   - `<Select>` com opções dinâmicas baseadas no tipo
   - INCOME: Serviço, Venda de Produto, Outros
   - EXPENSE: Compra de Estoque, Salários, Aluguel, Contas, Outros

3. **InputNumber** - Valor
   - `<InputNumber>` com formato monetário
   - Prefix: "R$"
   - Min: 0

4. **Input.TextArea** - Descrição
   - `<Input.TextArea>` com placeholder
   - Max length: 500 caracteres

5. **DatePicker** - Data
   - `<DatePicker>` com formato "DD/MM/YYYY"
   - Default: data atual

6. **Checkbox + Select** - Vinculação opcional
   - `<Checkbox>` + `<Select>` para vincular a serviço ou produto
   - Busca dinâmica de serviços/produtos via API

7. **Form** - Validação
   - `<Form>` do Ant Design
   - Validações: campos obrigatórios, valor > 0

### Estrutura do Formulário

```typescript
interface TransactionForm {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  date: Date;
  linkType?: 'service' | 'product';
  linkId?: string;
  notes?: string;
}
```

### Validações

1. **Tipo** - obrigatório
2. **Categoria** - obrigatória, mínimo 3 caracteres
3. **Valor** - obrigatório, maior que 0
4. **Descrição** - obrigatória, mínimo 5 caracteres
5. **Data** - obrigatória, não pode ser futura (opcional)

### Categorias Sugeridas

#### INCOME (Entradas)
- Serviço de Manutenção
- Venda de Produto
- Venda de Peça
- Serviço Externo
- Outros

#### EXPENSE (Saídas)
- Compra de Estoque
- Compra de Peças
- Salários
- Aluguel
- Energia Elétrica
- Água
- Internet
- Telefone
- Manutenção
- Impostos
- Outros

### Fluxo de Submissão

1. Usuário preenche o formulário
2. Validação no frontend
3. POST para `/api/cashflow`
4. Feedback de sucesso/erro
5. Limpa formulário ou redireciona para lista

### Funcionalidades Extras

1. **Salvamento Rápido**
   - Atalho de teclado (Ctrl+Enter) para salvar

2. **Templates**
   - Salvar transações frequentes como template
   - Botão "Usar template" para preencher automaticamente

3. **Busca de Serviços/Produtos**
   - Select com busca assíncrona
   - Mostra informações resumidas ao selecionar

4. **Notificações**
   - Toast de sucesso após cadastro
   - Toast de erro se falhar

---

## Estrutura de Arquivos Sugerida

```
src/
├── pages/
│   ├── Dashboard.tsx              # Tela principal do dashboard
│   ├── TransactionForm.tsx        # Formulário de transação
│   └── TransactionList.tsx        # Lista completa de transações
├── components/
│   ├── dashboard/
│   │   ├── FinancialSummaryCards.tsx
│   │   ├── CashFlowChart.tsx
│   │   ├── CategorySummaryTable.tsx
│   │   └── RecentTransactionsTable.tsx
│   └── transactions/
│       ├── TransactionTypeSelector.tsx
│       ├── CategorySelector.tsx
│       └── ServiceProductLink.tsx
├── hooks/
│   ├── useDashboardData.ts
│   ├── useTransactions.ts
│   ├── useCategories.ts
│   └── useCreateTransaction.ts
└── types/
    └── cashflow.ts
```

---

## Bibliotecas Adicionais Necessárias

1. **Gráficos**
   ```bash
   npm install @ant-design/charts
   # ou
   npm install recharts
   ```

2. **Manipulação de Datas**
   ```bash
   npm install dayjs
   ```

3. **Formatação de Moeda**
   ```bash
   npm install currency.js
   # ou usar Intl.NumberFormat nativo
   ```

---

## Próximos Passos (Implementação)

### Fase 1: Setup
- [ ] Instalar bibliotecas necessárias
- [ ] Criar estrutura de pastas
- [ ] Configurar tipos TypeScript

### Fase 2: Dashboard
- [ ] Criar componente Dashboard principal
- [ ] Implementar FinancialSummaryCards
- [ ] Implementar CashFlowChart
- [ ] Implementar CategorySummaryTable
- [ ] Implementar RecentTransactionsTable
- [ ] Integrar com APIs
- [ ] Adicionar filtros de período

### Fase 3: Formulário de Transação
- [ ] Criar formulário base com validação
- [ ] Implementar seletor de tipo (INCOME/EXPENSE)
- [ ] Implementar seletor de categoria dinâmico
- [ ] Implementar campo de valor (moeda)
- [ ] Implementar vinculação opcional (serviço/produto)
- [ ] Integrar com API POST /api/cashflow
- [ ] Adicionar feedback de sucesso/erro

### Fase 4: Lista de Transações
- [ ] Criar página de lista completa
- [ ] Implementar filtros avançados
- [ ] Implementar paginação
- [ ] Adicionar ações (editar, excluir)

### Fase 5: Testes e Refinamentos
- [ ] Testar fluxos completos
- [ ] Ajustar responsividade
- [ ] Otimizar performance
- [ ] Adicionar loading states

---

## Observações Técnicas

### Performance
- Usar React Query para cache de dados
- Implementar debounce em buscas
- Lazy loading para gráficos grandes

### Acessibilidade
- Labels claros em todos os campos
- Suporte a navegação por teclado
- Mensagens de erro descritivas

### Segurança
- Validação de dados no frontend e backend
- Proteção de rotas (middleware de autenticação)
- Sanitização de inputs

### UX
- Feedback imediato em todas as ações
- Loading states claros
- Mensagens de erro amigáveis
- Confirmação antes de deletar
