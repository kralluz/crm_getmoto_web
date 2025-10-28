# Feature: Gestão de Produtos e Estoque

## 📋 Visão Geral

Este módulo implementa completamente a gestão de produtos e controle de estoque, seguindo a especificação da API CRM GetMoto.

## 🎯 Funcionalidades Implementadas

### 1. **Gestão de Produtos**
- ✅ Listagem de produtos com filtros avançados
- ✅ Criação de novos produtos
- ✅ Edição de produtos existentes
- ✅ Exclusão de produtos (soft delete)
- ✅ Visualização detalhada de produtos
- ✅ Categorização de produtos
- ✅ Alertas de estoque baixo
- ✅ Cálculo automático de margem de lucro

### 2. **Controle de Estoque**
- ✅ Movimentações de estoque (Entrada, Saída, Ajuste)
- ✅ Histórico completo de movimentações
- ✅ Rastreamento de responsáveis
- ✅ Validação de estoque insuficiente
- ✅ Observações por movimentação

### 3. **Relatórios**
- ✅ Relatório completo de estoque
- ✅ Valor total do estoque
- ✅ Lucro potencial
- ✅ Produtos com estoque baixo
- ✅ Análise de movimentações por período
- ✅ Dashboard de alertas

## 📁 Estrutura de Arquivos

```
src/
├── api/
│   └── product-api.ts                 # Endpoints da API de produtos
│
├── types/
│   └── product.ts                     # TypeScript types/interfaces
│
├── hooks/
│   └── useProducts.ts                 # React Query hooks
│
├── components/
│   ├── products/
│   │   ├── CategorySelect.tsx         # Seletor de categorias
│   │   ├── StockMovementModal.tsx     # Modal de movimentação
│   │   └── index.ts                   # Exports
│   │
│   └── dashboard/
│       └── LowStockAlert.tsx          # Alerta de estoque baixo
│
└── pages/
    ├── ProductList.tsx                # Listagem de produtos
    ├── ProductForm.tsx                # Formulário (criar/editar)
    ├── ProductDetail.tsx              # Detalhes e histórico
    └── StockReport.tsx                # Relatório completo
```

## 🔌 Endpoints da API Utilizados

### Produtos
- `GET /api/products` - Listar produtos (com filtros)
- `GET /api/products/:id` - Buscar produto por ID
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto (soft delete)

### Movimentações de Estoque
- `GET /api/products/stock/movements` - Listar movimentações
- `POST /api/products/stock/movements` - Criar movimentação

## 📊 Tipos de Dados

### Product
```typescript
interface Product {
  product_id: number;
  category_id: number;
  product_name: string;
  quantity: number;
  quantity_alert: number;
  buy_price: number;
  sell_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_category?: ProductCategory;
  stock_move?: StockMove[];
}
```

### StockMove
```typescript
interface StockMove {
  stock_move_id: number;
  product_id: number;
  user_id: number | null;
  move_type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
  quantity: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users?: StockMoveUser;
  products?: Product;
}
```

## 🚀 Rotas Disponíveis

- `/produtos` - Lista de produtos
- `/produtos/novo` - Criar novo produto
- `/produtos/:id` - Detalhes do produto
- `/produtos/:id/editar` - Editar produto
- `/estoque` - Relatório de estoque

## 🎨 Componentes Principais

### ProductList
Tabela completa de produtos com:
- Busca por nome/categoria
- Filtros por status (ativo/inativo)
- Filtro de estoque baixo
- Ordenação por colunas
- Indicador visual de margem de lucro
- Indicador de estoque baixo
- Ações: visualizar, editar, deletar

### ProductForm
Formulário com validações para:
- Nome do produto (obrigatório, min 3 chars)
- Categoria (obrigatório)
- Preços de compra e venda (validação: venda >= compra)
- Cálculo automático de margem de lucro
- Quantidades de estoque
- Status ativo/inativo

### ProductDetail
Visualização detalhada com:
- Estatísticas principais (cards)
- Alerta de estoque baixo
- Informações completas
- Histórico de movimentações
- Botão para movimentar estoque
- Botão para editar

### StockMovementModal
Modal para registrar movimentações:
- Tipos: Entrada, Saída, Ajuste
- Validação de quantidade disponível
- Observações opcionais
- Preview do novo estoque
- Integração com React Query

### StockReport
Relatório completo com:
- Cards de estatísticas gerais
- Tabela de inventário com valores
- Filtros por produto e período
- Estatísticas de movimentações
- Exportação (preparado para implementação)

### LowStockAlert
Dashboard component mostrando:
- Produtos com estoque abaixo do mínimo
- Link para visualização completa
- Tabela resumida (5 primeiros)

## 🔧 Hooks Customizados

### useProducts
```typescript
// Listar produtos
const { data, isLoading } = useProducts({ active: true, lowStock: false });

// Buscar produto específico
const { data: product } = useProduct(productId);

// Criar produto
const { mutate: createProduct } = useCreateProduct();

// Atualizar produto
const { mutate: updateProduct } = useUpdateProduct();

// Deletar produto
const { mutate: deleteProduct } = useDeleteProduct();

// Produtos com estoque baixo
const { data: lowStock } = useLowStockProducts();
```

### Movimentações
```typescript
// Criar movimentação
const { mutate: createStockMove } = useCreateStockMove();

// Listar movimentações
const { data: moves } = useStockMoves({ productId, startDate, endDate });
```

## ⚙️ Configurações

### Categorias de Produtos
As categorias estão definidas em `src/components/products/CategorySelect.tsx`:
- Óleos e Lubrificantes
- Filtros
- Peças de Motor
- Peças de Suspensão
- Peças de Freio
- Pneus
- Baterias
- Correias e Correntes
- Iluminação
- Acessórios

**Nota**: Em produção, isso deve vir da API. Atualmente é um mock.

## 🎯 Validações Implementadas

### Produto
- ✅ Nome do produto: obrigatório, mínimo 3 caracteres
- ✅ Categoria: obrigatória
- ✅ Preço de compra: obrigatório, >= 0
- ✅ Preço de venda: obrigatório, >= preço de compra
- ✅ Quantidade: >= 0
- ✅ Estoque mínimo: >= 0

### Movimentação
- ✅ Tipo de movimentação: obrigatório
- ✅ Quantidade: obrigatória, > 0
- ✅ Saída: valida estoque disponível
- ✅ Observações: opcional, max 500 caracteres

## 🎨 Features de UX

### Indicadores Visuais
- 🟢 Margem >= 30%: Verde
- 🟠 Margem 15-30%: Laranja
- 🔴 Margem < 15%: Vermelho
- ⚠️ Estoque baixo: Ícone de alerta + cor vermelha

### Feedback ao Usuário
- ✅ Mensagens de sucesso em operações
- ❌ Mensagens de erro com detalhes
- ⏳ Loading states em todas as operações
- 🔄 Invalidação automática de cache (React Query)

### Responsividade
- 📱 Layout adaptável para mobile
- 📊 Tabelas com scroll horizontal
- 📏 Colunas responsivas nos formulários

## 📝 Próximos Passos Sugeridos

1. **Integração com API Real**
   - Conectar com backend
   - Implementar tratamento de erros específicos
   - Adicionar retry logic

2. **Categorias Dinâmicas**
   - Criar endpoint para categorias
   - CRUD de categorias
   - Filtro por categoria na listagem

3. **Exportação de Relatórios**
   - Exportar para Excel/CSV
   - Exportar para PDF
   - Gráficos de movimentações

4. **Código de Barras**
   - Campo para código de barras
   - Scanner integration
   - Impressão de etiquetas

5. **Imagens de Produtos**
   - Upload de imagens
   - Galeria de fotos
   - Thumbnail na listagem

6. **Notificações**
   - Push notifications para estoque baixo
   - Email alerts
   - Relatórios periódicos automáticos

7. **Histórico de Preços**
   - Tracking de alterações de preço
   - Gráfico de evolução de preços
   - Análise de margem ao longo do tempo

8. **Fornecedores**
   - Associar produtos a fornecedores
   - Histórico de compras
   - Comparação de preços

## 🧪 Testes Recomendados

- [ ] Criar produto com dados válidos
- [ ] Validar campos obrigatórios
- [ ] Editar produto existente
- [ ] Deletar produto
- [ ] Filtrar produtos por categoria
- [ ] Filtrar produtos com estoque baixo
- [ ] Criar movimentação de entrada
- [ ] Criar movimentação de saída (validar estoque)
- [ ] Criar movimentação de ajuste
- [ ] Visualizar histórico de movimentações
- [ ] Testar responsividade em mobile
- [ ] Testar paginação e ordenação

## 📚 Dependências

- `@tanstack/react-query` - Gerenciamento de estado assíncrono
- `antd` - Componentes UI
- `dayjs` - Manipulação de datas
- `react-router-dom` - Roteamento
- `axios` - HTTP client

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Adicione tipos em `types/product.ts`
2. Crie endpoints em `api/product-api.ts`
3. Adicione hooks em `hooks/useProducts.ts`
4. Crie/atualize componentes conforme necessário
5. Adicione rotas em `routes/index.tsx`
6. Atualize esta documentação

---

**Desenvolvido para**: CRM GetMoto  
**Versão**: 1.0.0  
**Data**: Outubro 2024
