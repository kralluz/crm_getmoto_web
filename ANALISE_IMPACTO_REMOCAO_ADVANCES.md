# Análise de Impacto - Remoção do Módulo de Advances (Vales)

**Data:** 30/11/2025
**Analista:** Claude AI
**Objetivo:** Avaliar impacto da remoção completa do módulo de Advances (vales/adiantamentos)

---

## 📊 Resumo Executivo

O módulo de **Advances** (vales/adiantamentos) está **fortemente integrado** ao sistema de folha de pagamento. A remoção dele tem **impacto significativo** no backend e médio no frontend.

### ⚠️ Classificação de Impacto: **ALTO**

- **Backend:** Mudanças em 5 arquivos principais + schema do banco
- **Frontend:** Remoção de 8 arquivos + ajustes em 5 páginas
- **Banco de Dados:** 2 tabelas a serem removidas (com dados)
- **Funcionalidade Afetada:** Sistema de folha de pagamento perde dedução automática

---

## 🔍 Componentes Afetados no Backend

### 1. **Banco de Dados (Prisma Schema)**

#### Tabelas a Remover:
```prisma
✗ employee_advances (tabela principal)
  - advance_id (PK)
  - employee_id (FK para employees)
  - amount_pence
  - advance_date
  - status (PENDING/DEDUCTED/CANCELLED)
  - deducted_at
  - reason, notes
  - Campos de auditoria (created_at, created_by, etc.)
  - cash_flow (relação)

✗ payroll_payment_advances (tabela de relação N:N)
  - id (PK)
  - payment_id (FK para payroll_payments)
  - advance_id (FK para employee_advances)
  - amount_pence
```

#### Tabelas com Campos a Remover:
```prisma
⚠️ cash_flow
  - employee_advance_id (FK - pode ser NULL, seguro remover)

⚠️ payroll_payments
  - advances_deducted_pence (campo calculado - pode ser zerado ou removido)
```

---

### 2. **Serviços (Business Logic)**

#### ❌ Arquivo a Remover Completo:
- `src/services/advance.service.ts` (174 linhas)
  - Métodos: create, getAll, getById, getPending, cancel

#### ⚠️ Arquivos a Modificar:

**`src/services/payroll-payment.service.ts`** (309 linhas)
- **Linhas 3:** Importação do advanceService → **REMOVER**
- **Linhas 11-38:** Método `calculateAdvancesToDeduct()` → **REMOVER**
- **Linha 138:** `const pendingAdvances = await advanceService.getPending(...)` → **REMOVER**
- **Linhas 151-154:** Cálculo de advances → **REMOVER**
- **Linha 156:** `netAmountPence = grossAmountPence - deductionsPence - totalAdvancesPence` → **SIMPLIFICAR**
  - Nova versão: `netAmountPence = grossAmountPence - deductionsPence`
- **Linha 178:** `advances_deducted_pence: totalAdvancesPence` → **DEFINIR como 0**
- **Linhas 187-208:** Criação de payment-advances e atualização de status → **REMOVER TODO BLOCO**
- **Linhas 268-285:** Reversão de advances no cancelamento → **REMOVER TODO BLOCO**

**Impacto:** ~60 linhas removidas, lógica de dedução simplificada

**`src/services/employee.service.ts`**
- Provavelmente tem relação `include: { advances: true }` → **REMOVER**

---

### 3. **Controllers**

#### ❌ Arquivo a Remover Completo:
- `src/controllers/AdvanceController.ts`
  - Endpoints: POST /create, GET /, GET /:id, GET /pending/:employee_id, POST /cancel/:id

---

### 4. **Rotas**

#### ❌ Arquivo a Remover Completo:
- `src/routes/advance.routes.ts`

#### ⚠️ Arquivos a Modificar:
**`src/app.ts`**
- Linha de import: `import advanceRoutes from './routes/advance.routes'` → **REMOVER**
- Linha de registro: `app.use('/api/advances', advanceRoutes)` → **REMOVER**

---

### 5. **Schemas de Validação (Zod)**

#### ❌ Arquivo a Remover Completo:
- `src/schemas/advance.schema.ts`
  - CreateAdvanceDTO
  - CancelAdvanceDTO
  - validadores

---

### 6. **Swagger Documentation**

#### Endpoints a Remover:
- POST `/api/advances` - Create advance
- GET `/api/advances` - List advances
- GET `/api/advances/:id` - Get advance by ID
- GET `/api/advances/pending/:employee_id` - Get pending advances
- POST `/api/advances/cancel/:id` - Cancel advance

**Total:** 5 endpoints removidos da documentação

---

## 🌐 Componentes Afetados no Frontend

### 1. **Páginas a Remover**

#### ❌ Arquivos a Deletar:
- `src/pages/AdvanceList.tsx` (160 linhas)
- `src/pages/AdvanceForm.tsx` (95 linhas)

**Total:** 2 páginas, 255 linhas

---

### 2. **Hooks a Remover**

#### ❌ Arquivo a Deletar:
- `src/hooks/useAdvances.ts` (68 linhas)
  - useAdvances()
  - usePendingAdvances()
  - useAdvance()
  - useCreateAdvance()
  - useCancelAdvance()

---

### 3. **API Clients a Remover**

#### ❌ Arquivo a Deletar:
- `src/api/advance-api.ts` (~80 linhas estimadas)
  - getAll()
  - getById()
  - getPending()
  - create()
  - cancel()

---

### 4. **Types a Remover**

#### ❌ Arquivo a Deletar:
- `src/types/advance.ts` (41 linhas)
  - AdvanceStatus type
  - Advance interface
  - CreateAdvanceData interface
  - CancelAdvanceData interface

---

### 5. **Rotas a Remover**

#### ⚠️ Arquivo a Modificar:
**`src/routes/index.tsx`**
- Import: `import { AdvanceList } from '../pages/AdvanceList'` → **REMOVER**
- Import: `import { AdvanceForm } from '../pages/AdvanceForm'` → **REMOVER**
- Rota: `{ path: 'advances', element: <AdvanceList /> }` → **REMOVER**
- Rota: `{ path: 'advances/new', element: <AdvanceForm /> }` → **REMOVER**

**Total:** 2 rotas removidas

---

### 6. **Menu Lateral a Ajustar**

#### ⚠️ Arquivo a Modificar:
**`src/layouts/AppSidebar.tsx`**
- Import: `WalletOutlined` → **REMOVER** (se não usado em outro lugar)
- Menu item: `{ key: 'advances', icon: <WalletOutlined />, label: 'Advances' }` → **REMOVER**
- openKeys: Remover referência a 'advances' → **AJUSTAR**

**`src/layouts/MainLayout.tsx`**
- routeMap: `'advances': 'advances'` → **REMOVER**
- getOpenKeys: Condição para 'advances' → **REMOVER**

---

### 7. **Páginas a Modificar**

#### ⚠️ Modificações Necessárias:

**`src/pages/EmployeeDetail.tsx`** (175 linhas)
- Import: `import { useAdvances } from '../hooks/useAdvances'` → **REMOVER**
- Import: `import type { Advance } from '../types/advance'` → **REMOVER**
- Hook call: `const { data: advances = [] } = useAdvances({ employee_id: Number(id) })` → **REMOVER**
- Aba: `{ key: 'advances', label: 'Advances (${advances.length})', children: <Table... /> }` → **REMOVER**
- advanceColumns definition → **REMOVER**

**Resultado:** Funcionário fica com apenas 2 abas: Time Entries e Payroll Payments

---

**`src/pages/PayrollPaymentForm.tsx`** (295 linhas)
- Import: `import { usePendingAdvances } from '../hooks/useAdvances'` → **REMOVER**
- Import: `import type { Advance } from '../types/advance'` → **REMOVER**
- Hook call: `const { data: pendingAdvances = [] } = usePendingAdvances(selectedEmployeeId)` → **REMOVER**
- State: `pendingAdvances: Advance[]` → **REMOVER do tipo**
- State: `totalAdvances: number` → **REMOVER**
- Cálculo de advances (linhas 71-82) → **REMOVER TODO BLOCO**
- Linha 84: `const netAmountPence = grossAmountPence - totalAdvancesPence` → **SIMPLIFICAR**
  - Nova versão: `const netAmountPence = grossAmountPence`
- Seção UI "Advances to be Deducted" (linhas 233-252) → **REMOVER**
- advanceColumns definition → **REMOVER**

**Resultado:** Formulário de pagamento não mostra/deduz advances

---

**`src/pages/PayrollPaymentDetail.tsx`** (176 linhas)
- Cálculo: `const totalAdvancesPence = deductedAdvances.reduce(...)` → **REMOVER ou ZERAR**
- Seção UI: `{totalAdvancesPence > 0 && <Descriptions.Item label="Advance Deductions">...</Descriptions.Item>}` → **REMOVER**
- Seção UI: `{deductedAdvances.length > 0 && <Card title="Deducted Advances">...</Card>}` → **REMOVER**

**Resultado:** Detalhes do pagamento não mostram advances deduzidos

---

**`src/pages/PayrollPaymentList.tsx`** (217 linhas)
- Sem impacto direto (apenas exibe dados do backend)

---

### 8. **Hooks a Modificar**

#### ⚠️ Modificações Necessárias:

**`src/hooks/usePayrollPayments.ts`** (70 linhas)
- Linha 32: `queryClient.invalidateQueries({ queryKey: ['advances'] })` → **REMOVER**
- Linha 53: `queryClient.invalidateQueries({ queryKey: ['advances'] })` → **REMOVER**
- Linha 61: `queryClient.invalidateQueries({ queryKey: ['advances'] })` → **REMOVER**

**Resultado:** Cache de advances não é mais invalidado (pois não existe)

---

## 📈 Resumo de Impacto

### Backend (API)

| Componente | Ação | Qtd Arquivos | Linhas Afetadas |
|------------|------|--------------|-----------------|
| Tabelas DB | Remover | 2 tabelas | - |
| Services | Remover | 1 arquivo | 174 linhas |
| Services | Modificar | 1 arquivo | ~60 linhas |
| Controllers | Remover | 1 arquivo | ~80 linhas |
| Routes | Remover | 1 arquivo | ~40 linhas |
| Schemas | Remover | 1 arquivo | ~50 linhas |
| App.ts | Modificar | 1 arquivo | 2 linhas |
| **TOTAL** | - | **8 arquivos** | **~406 linhas** |

### Frontend (React)

| Componente | Ação | Qtd Arquivos | Linhas Afetadas |
|------------|------|--------------|-----------------|
| Pages | Remover | 2 arquivos | 255 linhas |
| Hooks | Remover | 1 arquivo | 68 linhas |
| API Clients | Remover | 1 arquivo | ~80 linhas |
| Types | Remover | 1 arquivo | 41 linhas |
| Routes | Modificar | 1 arquivo | 4 linhas |
| Layouts | Modificar | 2 arquivos | ~10 linhas |
| Pages | Modificar | 3 arquivos | ~80 linhas |
| Hooks | Modificar | 1 arquivo | 3 linhas |
| **TOTAL** | - | **12 arquivos** | **~541 linhas** |

---

## ⚠️ Riscos e Considerações

### 1. **Perda de Dados**
- ❌ **CRÍTICO:** Todos os vales registrados serão perdidos ao dropar as tabelas
- ⚠️ **Recomendação:** Fazer backup antes de remover
- ⚠️ **Alternativa:** Manter tabelas mas desabilitar funcionalidade (soft removal)

### 2. **Impacto Funcional**
- ❌ Sistema de folha de pagamento perde funcionalidade de dedução automática
- ❌ Funcionários não poderão mais receber vales/adiantamentos
- ⚠️ Histórico de vales em pagamentos antigos será perdido

### 3. **Impacto em Relatórios**
- ⚠️ Relatórios históricos de payroll que incluíam advances ficarão incompletos
- ⚠️ Cash flow terá entradas órfãs (se não remover campo employee_advance_id)

### 4. **Migrações do Banco**
- ⚠️ Necessário criar migration Prisma para:
  1. Remover foreign keys
  2. Dropar tabelas payroll_payment_advances
  3. Dropar tabela employee_advances
  4. Remover coluna cash_flow.employee_advance_id (opcional)
  5. Remover/zerar coluna payroll_payments.advances_deducted_pence (opcional)

---

## ✅ Plano de Remoção Recomendado

### Opção 1: Remoção Completa (Hard Delete)

**Vantagens:**
- ✅ Código mais limpo
- ✅ Banco de dados mais simples
- ✅ Menos manutenção

**Desvantagens:**
- ❌ Perda de dados históricos
- ❌ Não reversível sem backup

**Passos:**
1. **Backup do banco de dados**
2. **Frontend:** Remover 8 arquivos + modificar 5 arquivos
3. **Backend:** Remover 5 arquivos + modificar 2 arquivos
4. **Database:** Criar migration para dropar tabelas
5. **Testes:** Verificar payroll funciona sem advances
6. **Deploy:** Backend primeiro, depois frontend

---

### Opção 2: Soft Removal (Manter DB, Remover UI)

**Vantagens:**
- ✅ Dados históricos preservados
- ✅ Reversível
- ✅ Backend pode ser reativado facilmente

**Desvantagens:**
- ⚠️ Código morto no backend
- ⚠️ Tabelas no banco sem uso

**Passos:**
1. **Frontend:** Remover apenas UI (8 arquivos)
2. **Backend:** Manter código mas não expor rotas (comentar registros em app.ts)
3. **Database:** Manter tabelas intactas
4. **Testes:** Verificar payroll funciona sem advances
5. **Deploy:** Frontend apenas

---

### Opção 3: Feature Flag (Mais Complexo)

**Vantagens:**
- ✅ Liga/desliga funcionalidade sem código
- ✅ Totalmente reversível
- ✅ Pode ser por cliente/empresa

**Desvantagens:**
- ❌ Mais complexo de implementar
- ❌ Adiciona complexidade ao código

**Não recomendado para este caso.**

---

## 🎯 Recomendação Final

Para este projeto, recomendo **Opção 1: Remoção Completa** pelos seguintes motivos:

1. ✅ Sistema ainda em desenvolvimento (não há dados críticos em produção)
2. ✅ Simplifica arquitetura
3. ✅ Reduz superfície de manutenção
4. ✅ Melhora performance (menos joins, menos índices)

**⚠️ IMPORTANTE:** Fazer backup completo antes de qualquer remoção!

---

## 📋 Checklist de Execução

### Preparação
- [ ] Backup completo do banco de dados
- [ ] Backup do código (git commit)
- [ ] Documentar dados existentes (se houver)

### Frontend (Executar Primeiro)
- [ ] Remover páginas: AdvanceList.tsx, AdvanceForm.tsx
- [ ] Remover hooks: useAdvances.ts
- [ ] Remover API: advance-api.ts
- [ ] Remover types: advance.ts
- [ ] Modificar: routes/index.tsx
- [ ] Modificar: layouts/AppSidebar.tsx
- [ ] Modificar: layouts/MainLayout.tsx
- [ ] Modificar: pages/EmployeeDetail.tsx
- [ ] Modificar: pages/PayrollPaymentForm.tsx
- [ ] Modificar: pages/PayrollPaymentDetail.tsx
- [ ] Modificar: hooks/usePayrollPayments.ts
- [ ] Build e testar frontend
- [ ] Commit: "Remove advances module from frontend"

### Backend (Executar Depois)
- [ ] Remover: services/advance.service.ts
- [ ] Remover: controllers/AdvanceController.ts
- [ ] Remover: routes/advance.routes.ts
- [ ] Remover: schemas/advance.schema.ts
- [ ] Modificar: services/payroll-payment.service.ts
- [ ] Modificar: app.ts
- [ ] Modificar: prisma/schema.prisma
- [ ] Criar migration: `npx prisma migrate dev --name remove_advances`
- [ ] Build e testar backend
- [ ] Commit: "Remove advances module from backend"

### Testes
- [ ] Criar funcionário
- [ ] Criar time entries
- [ ] Criar payroll payment (sem advances)
- [ ] Verificar cálculos corretos
- [ ] Cancelar payroll payment
- [ ] Verificar reversão funciona

---

**Fim da Análise**

*Documento gerado automaticamente para avaliar impacto da remoção do módulo de Advances.*
