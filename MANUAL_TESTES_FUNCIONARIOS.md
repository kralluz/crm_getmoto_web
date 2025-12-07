# Manual de Testes - Módulo de Gestão de Funcionários

**Versão:** 1.0
**Data:** 30/11/2025
**Sistema:** CRM GetMoto - Frontend

---

## Índice

1. [Preparação do Ambiente de Testes](#1-preparação-do-ambiente-de-testes)
2. [Testes de Funcionários (Employees)](#2-testes-de-funcionários-employees)
3. [Testes de Registros de Ponto (Time Entries)](#3-testes-de-registros-de-ponto-time-entries)
4. [Testes de Vales (Advances)](#4-testes-de-vales-advances)
5. [Testes de Folha de Pagamento (Payroll Payments)](#5-testes-de-folha-de-pagamento-payroll-payments)
6. [Testes de Integração](#6-testes-de-integração)
7. [Testes de Validação e Edge Cases](#7-testes-de-validação-e-edge-cases)
8. [Testes de UI/UX](#8-testes-de-uiux)
9. [Checklist Final](#9-checklist-final)

---

## 1. Preparação do Ambiente de Testes

### 1.1 Pré-requisitos
- [ ] Backend rodando em http://localhost:3000 (ou porta configurada)
- [ ] Frontend rodando em http://localhost:5173 (ou porta configurada)
- [ ] Banco de dados PostgreSQL limpo ou com dados de teste
- [ ] Usuário autenticado no sistema

### 1.2 Dados de Teste Sugeridos

Criar os seguintes funcionários para testes:

| Nome | Cargo | Hourly Rate | Contract Type | Weekly Hours | Start Date |
|------|-------|-------------|---------------|--------------|------------|
| John Smith | Mechanic | £15.00 | HOURLY | 40 | 01/01/2025 |
| Sarah Johnson | Assistant | £12.50 | HOURLY | 40 | 15/01/2025 |
| Mike Brown | Senior Mechanic | £18.00 | HOURLY | 40 | 01/11/2024 |
| Emma Davis | Apprentice | £10.00 | HOURLY | 30 | 01/02/2025 |

---

## 2. Testes de Funcionários (Employees)

### 2.1 Teste: Listar Funcionários

**Objetivo:** Verificar a listagem de funcionários

**Passos:**
1. Acesse a rota `/employees`
2. Verifique se a página carrega sem erros
3. Confirme que a tabela está visível
4. Verifique se o botão "New Employee" está presente

**Resultado Esperado:**
- ✅ Tabela com colunas: Name, Job Title, Hourly Rate, Contract Type, Status, Actions
- ✅ Dados formatados corretamente (£15.00/hour)
- ✅ Status com badges coloridos (Active = verde, Inactive = vermelho)
- ✅ Botões de ação: Edit, Disable (ou Enable se inativo)

---

### 2.2 Teste: Criar Novo Funcionário

**Objetivo:** Criar um novo funcionário com sucesso

**Passos:**
1. Na página `/employees`, clique em "New Employee"
2. Preencha o formulário:
   - First Name: `Test`
   - Last Name: `Employee`
   - Email: `test.employee@getmoto.com`
   - Phone: `07700900123`
   - National Insurance: `AB123456C`
   - Job Title: `Tester`
   - Hourly Rate: `14.50`
   - Contract Type: `HOURLY`
   - Weekly Hours: `40`
   - Start Date: Data atual
   - Address: `123 Test Street, London, UK`
3. Clique em "Create"

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Employee created successfully"
- ✅ Redirecionamento para `/employees`
- ✅ Novo funcionário aparece na lista
- ✅ Dados salvos corretamente no backend

**Casos de Erro a Testar:**
- [ ] Tentar criar sem preencher campos obrigatórios (First Name, Last Name, Job Title, Hourly Rate)
- [ ] Usar email inválido (ex: `teste@` ou `teste.com`)
- [ ] Usar hourly rate negativo ou zero
- [ ] Usar weekly hours fora do range (< 1 ou > 168)

---

### 2.3 Teste: Editar Funcionário

**Objetivo:** Atualizar dados de um funcionário existente

**Passos:**
1. Na lista de funcionários, clique no botão "Edit" de um funcionário
2. Modifique os seguintes campos:
   - Job Title: `Senior Tester`
   - Hourly Rate: `16.00`
   - Weekly Hours: `35`
3. Clique em "Update"

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Employee updated successfully"
- ✅ Redirecionamento para `/employees`
- ✅ Dados atualizados visíveis na lista
- ✅ Alterações persistidas no backend

**Nota:** Verificar que não é possível editar a End Date se o funcionário está ativo.

---

### 2.4 Teste: Visualizar Detalhes do Funcionário

**Objetivo:** Visualizar informações completas de um funcionário

**Passos:**
1. Na lista de funcionários, clique no nome de um funcionário (ou no ID)
2. Navegue até a página de detalhes (`/employees/:id`)
3. Verifique todas as seções:
   - Informações básicas (Employee ID, Job Title, Email, Phone, etc.)
   - Abas: Time Entries, Advances, Payroll Payments

**Resultado Esperado:**
- ✅ Todas as informações exibidas corretamente
- ✅ Hourly Rate formatado em GBP (£)
- ✅ Datas formatadas em DD/MM/YYYY
- ✅ Status exibido com badge colorido
- ✅ Botões de ação funcionais (Edit, Disable/Enable)
- ✅ Abas exibindo dados relacionados (inicialmente vazias se funcionário novo)

---

### 2.5 Teste: Desabilitar Funcionário

**Objetivo:** Marcar um funcionário como inativo

**Passos:**
1. Na página de detalhes de um funcionário ativo, clique em "Disable"
2. Confirme na modal de confirmação
3. Aguarde a operação completar

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Employee disabled successfully"
- ✅ Status muda para "Inactive" (badge vermelho)
- ✅ Botão "Disable" muda para "Enable"
- ✅ Funcionário ainda visível na lista (soft delete)

---

### 2.6 Teste: Habilitar Funcionário

**Objetivo:** Reativar um funcionário inativo

**Passos:**
1. Na página de detalhes de um funcionário inativo, clique em "Enable"
2. Aguarde a operação completar

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Employee enabled successfully"
- ✅ Status muda para "Active" (badge verde)
- ✅ Botão "Enable" muda para "Disable"

---

### 2.7 Teste: Filtros na Lista de Funcionários

**Objetivo:** Verificar filtros de busca e status

**Passos:**
1. Na página `/employees`, use a barra de busca para filtrar por nome
2. Digite `John` e verifique resultados
3. Limpe o filtro
4. Use o filtro de status (Active/Inactive)

**Resultado Esperado:**
- ✅ Busca filtra resultados em tempo real
- ✅ Filtro de status exibe apenas funcionários do status selecionado
- ✅ Limpar filtros restaura lista completa

---

## 3. Testes de Registros de Ponto (Time Entries)

### 3.1 Teste: Clock In (Registrar Entrada)

**Objetivo:** Registrar início de trabalho de um funcionário

**Passos:**
1. Acesse `/time-entries`
2. Clique em "Clock In"
3. Selecione um funcionário: `John Smith`
4. Deixe a data/hora padrão (atual) ou ajuste se necessário
5. Adicione uma nota (opcional): `Starting morning shift`
6. Clique em "Clock In"

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Time entry created successfully"
- ✅ Redirecionamento para `/time-entries`
- ✅ Nova entrada visível na lista
- ✅ Status "In Progress" (tag azul) na coluna Clock Out
- ✅ Total Hours mostra "-" (ainda em andamento)

---

### 3.2 Teste: Clock Out (Registrar Saída)

**Objetivo:** Finalizar registro de ponto

**Passos:**
1. Na lista de time entries, identifique uma entrada "In Progress"
2. Clique no botão "Clock Out"
3. Na página de edição, selecione um horário de saída
   - Exemplo: Se Clock In foi 09:00, use Clock Out 17:00
4. Adicione notas (opcional): `Regular work day`
5. Clique em "Clock Out"

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Time entry updated successfully"
- ✅ Entrada atualizada na lista
- ✅ Clock Out mostra data/hora formatada
- ✅ Total Hours calculado automaticamente (ex: 8.00 hrs)
- ✅ Regular Hours e Overtime Hours calculados corretamente
  - **Regular:** até 40h/semana
  - **Overtime:** acima de 40h/semana

**Validação de Cálculo:**
- Se funcionário trabalhou 8 horas em um dia (09:00 - 17:00):
  - Total Hours: 8.00
  - Regular Hours: 8.00 (se total semanal < 40h)
  - Overtime Hours: 0.00

---

### 3.3 Teste: Listar Time Entries

**Objetivo:** Visualizar todos os registros de ponto

**Passos:**
1. Acesse `/time-entries`
2. Verifique a tabela completa
3. Use os filtros:
   - Filtrar por funcionário
   - Filtrar por período (range de datas)

**Resultado Esperado:**
- ✅ Tabela com colunas: Employee, Clock In, Clock Out, Total Hours, Regular, Overtime, Notes, Actions
- ✅ Entradas ordenadas por data (mais recente primeiro)
- ✅ Filtros funcionam corretamente
- ✅ Paginação (20 itens por página)

---

### 3.4 Teste: Deletar Time Entry

**Objetivo:** Remover um registro de ponto

**Passos:**
1. Na lista de time entries, clique no ícone de delete (lixeira)
2. Confirme na modal de confirmação
3. Aguarde a operação

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Time entry deleted successfully"
- ✅ Entrada removida da lista
- ✅ Dados removidos do backend

**Nota:** Este é um hard delete, diferente do soft delete de employees.

---

### 3.5 Teste: Visualizar Time Entries na Página do Funcionário

**Objetivo:** Ver histórico de ponto de um funcionário específico

**Passos:**
1. Acesse `/employees/:id` de um funcionário com time entries
2. Clique na aba "Time Entries"
3. Verifique a tabela

**Resultado Esperado:**
- ✅ Mostra apenas time entries deste funcionário
- ✅ Dados formatados corretamente
- ✅ Ordenação por data

---

## 4. Testes de Vales (Advances)

### 4.1 Teste: Criar Novo Vale

**Objetivo:** Registrar adiantamento salarial para um funcionário

**Passos:**
1. Acesse `/advances`
2. Clique em "New Advance"
3. Preencha o formulário:
   - Employee: `John Smith`
   - Amount: `100.00` (£100.00)
   - Advance Date: Data atual
   - Reason: `Emergency car repair`
4. Clique em "Create Advance"

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Advance created successfully"
- ✅ Redirecionamento para `/advances`
- ✅ Vale aparece na lista com status "PENDING" (badge laranja)
- ✅ Valor formatado em GBP: £100.00

---

### 4.2 Teste: Listar Vales

**Objetivo:** Visualizar todos os vales registrados

**Passos:**
1. Acesse `/advances`
2. Verifique a tabela
3. Use os filtros:
   - Filtrar por funcionário
   - Filtrar por status (Pending, Deducted, Cancelled)

**Resultado Esperado:**
- ✅ Tabela com colunas: Employee, Date, Amount, Status, Reason, Payment Reference, Actions
- ✅ Status coloridos: Pending (laranja), Deducted (verde), Cancelled (vermelho)
- ✅ Payment Reference mostra ID do pagamento quando deduzido
- ✅ Summary no rodapé: Total Pending Advances (soma dos vales pendentes)
- ✅ Filtros funcionam corretamente

---

### 4.3 Teste: Cancelar Vale

**Objetivo:** Cancelar um vale que não foi deduzido

**Passos:**
1. Na lista de advances, identifique um vale com status "PENDING"
2. Clique no botão "Cancel"
3. Na modal, insira uma razão: `Reimbursed by employee`
4. Clique em "Cancel Advance"

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Advance cancelled successfully"
- ✅ Status muda para "CANCELLED" (badge vermelho)
- ✅ Não aparece mais no summary de pending advances
- ✅ Botão "Cancel" desaparece (já cancelado)

**Validação de Erro:**
- [ ] Tentar cancelar sem inserir razão → Deve exibir erro "Cancellation reason is required"

---

### 4.4 Teste: Visualizar Vales na Página do Funcionário

**Objetivo:** Ver histórico de vales de um funcionário

**Passos:**
1. Acesse `/employees/:id` de um funcionário com advances
2. Clique na aba "Advances"
3. Verifique a tabela

**Resultado Esperado:**
- ✅ Mostra apenas advances deste funcionário
- ✅ Todos os status visíveis
- ✅ Dados formatados corretamente

---

## 5. Testes de Folha de Pagamento (Payroll Payments)

### 5.1 Teste: Criar Pagamento de Folha (Cenário Simples)

**Objetivo:** Gerar folha de pagamento para um funcionário sem vales

**Pré-requisito:** Funcionário deve ter time entries registrados no período

**Passos:**
1. Acesse `/payroll-payments`
2. Clique em "New Payment"
3. Selecione Employee: `Sarah Johnson`
4. Selecione Pay Period: `01/11/2025` até `07/11/2025` (1 semana)
5. Clique em "Calculate Payment"
6. Verifique os valores calculados:
   - Total Hours
   - Gross Amount
   - Net Amount
7. Selecione Payment Date: `08/11/2025`
8. Clique em "Create Payment"

**Resultado Esperado:**
- ✅ Cálculo automático baseado em time entries do período
- ✅ Total Hours = soma de (regular_hours + overtime_hours) das time entries
- ✅ Gross Amount = Total Hours × Hourly Rate
- ✅ Se não há vales: Net Amount = Gross Amount
- ✅ Notificação de sucesso: "Payment created successfully"
- ✅ Redirecionamento para `/payroll-payments`
- ✅ Pagamento na lista com status "PAID" (badge verde)

**Exemplo de Cálculo:**
- Sarah Johnson: £12.50/hour
- Time entries no período: 40 horas (8h × 5 dias)
- Gross Amount: 40 × £12.50 = £500.00
- Net Amount: £500.00 (sem deduções)

---

### 5.2 Teste: Criar Pagamento com Deduções de Vales

**Objetivo:** Verificar dedução automática de vales pendentes

**Pré-requisito:**
- Funcionário com time entries no período
- Funcionário com vales PENDING

**Passos:**
1. Crie um vale para `John Smith`: £150.00
2. Acesse `/payroll-payments/new`
3. Selecione Employee: `John Smith`
4. Selecione Pay Period que contenha time entries
5. Clique em "Calculate Payment"
6. Verifique a seção "Advances to be Deducted"

**Resultado Esperado:**
- ✅ Vale de £150.00 aparece na tabela de advances to be deducted
- ✅ Total Advances Deducted: £150.00 (em vermelho)
- ✅ Net Amount = Gross Amount - Total Advances
- ✅ Exemplo:
  - Gross: £600.00
  - Advances: -£150.00
  - Net: £450.00

**Após criar o pagamento:**
- ✅ Vale muda de status "PENDING" para "DEDUCTED"
- ✅ Payment Reference no vale mostra o ID do pagamento

---

### 5.3 Teste: Criar Pagamento com Múltiplos Vales

**Objetivo:** Deduzir múltiplos vales em um único pagamento

**Passos:**
1. Crie 3 vales para um funcionário:
   - £100.00
   - £80.00
   - £50.00
   Total: £230.00
2. Crie pagamento para período que resulte em Gross > £230.00
3. Verifique que todos os 3 vales aparecem na lista de deduções
4. Crie o pagamento

**Resultado Esperado:**
- ✅ Todos os 3 vales deduzidos
- ✅ Total Advances: £230.00
- ✅ Net Amount correto
- ✅ Todos os 3 vales mudam para status "DEDUCTED"

---

### 5.4 Teste: Criar Pagamento com Vale Parcial

**Objetivo:** Verificar comportamento quando vale é maior que o salário

**Passos:**
1. Crie um vale de £800.00 para um funcionário
2. Crie pagamento que resulte em Gross de £500.00
3. Observe o comportamento

**Resultado Esperado:**
- ✅ Sistema **NÃO** deduz o vale (não há saldo suficiente)
- ✅ Seção "Advances to be Deducted" vazia
- ✅ Net Amount = Gross Amount
- ✅ Vale permanece como "PENDING"

**Nota:** O sistema só deduz vales se o gross amount cobrir o valor completo do vale.

---

### 5.5 Teste: Listar Pagamentos de Folha

**Objetivo:** Visualizar todos os pagamentos processados

**Passos:**
1. Acesse `/payroll-payments`
2. Verifique a tabela
3. Use o filtro por funcionário

**Resultado Esperado:**
- ✅ Tabela com colunas: Employee, Payment Date, Period, Hours, Gross, Deductions, Net Amount, Status, Actions
- ✅ Período formatado: "01/11 - 07/11/2025"
- ✅ Hours com badge azul
- ✅ Net Amount em verde e negrito
- ✅ Summary no rodapé: Total Paid (soma dos pagamentos não cancelados)
- ✅ Paginação

---

### 5.6 Teste: Visualizar Detalhes do Pagamento

**Objetivo:** Ver breakdown completo de um pagamento

**Passos:**
1. Na lista de payments, clique em "View" de um pagamento
2. Navegue para `/payroll-payments/:id`
3. Verifique todas as seções

**Resultado Esperado:**
- ✅ **Employee Information:** Nome, Job Title, Hourly Rate
- ✅ **Payment Details:**
  - Payment Date
  - Pay Period
  - Regular Hours (tag azul)
  - Overtime Hours (tag laranja)
  - Total Hours (tag verde)
  - Effective Hourly Rate calculado
- ✅ **Payment Calculation:**
  - Regular Pay
  - Overtime Pay
  - Bonuses (£0.00 se não implementado)
  - Gross Amount
  - Tax/NI Deductions (£0.00 se não implementado)
  - Advance Deductions (se houver)
  - Net Amount (verde, grande)
- ✅ **Deducted Advances Table** (se houver):
  - Advance ID, Date, Amount, Reason

---

### 5.7 Teste: Cancelar Pagamento

**Objetivo:** Reverter um pagamento já processado

**Passos:**
1. Na lista de payments, clique em "Cancel" de um pagamento PAID
2. Na modal, insira razão: `Incorrect calculation - overtime not applied`
3. Confirme

**Resultado Esperado:**
- ✅ Notificação de sucesso: "Payment cancelled successfully"
- ✅ Status muda para "CANCELLED" (badge vermelho)
- ✅ Botão "Cancel" desaparece
- ✅ **Vales deduzidos revertem para status "PENDING"**
- ✅ Cash flow reverso criado no backend
- ✅ No summary, pagamento cancelado não conta no total

**Na página de detalhes:**
- ✅ Alert vermelho: "Payment Cancelled" com razão

---

### 5.8 Teste: Visualizar Pagamentos na Página do Funcionário

**Objetivo:** Ver histórico de pagamentos de um funcionário

**Passos:**
1. Acesse `/employees/:id`
2. Clique na aba "Payroll Payments"
3. Verifique a tabela

**Resultado Esperado:**
- ✅ Mostra apenas payments deste funcionário
- ✅ Todos os status visíveis (Paid e Cancelled)
- ✅ Dados formatados corretamente

---

## 6. Testes de Integração

### 6.1 Teste: Fluxo Completo de Pagamento

**Objetivo:** Simular processo completo de 1 semana de trabalho

**Cenário:**
- Funcionário: Mike Brown (£18.00/hour)
- Período: 01/11/2025 a 07/11/2025

**Passos:**

**Segunda-feira (01/11):**
1. Clock In: 09:00
2. Clock Out: 17:00 (8 horas)

**Terça-feira (02/11):**
1. Clock In: 09:00
2. Clock Out: 18:00 (9 horas) - 1 hora overtime

**Quarta-feira (03/11):**
1. Criar vale de £200.00 (Emergency expense)
2. Clock In: 09:00
3. Clock Out: 17:00 (8 horas)

**Quinta-feira (04/11):**
1. Clock In: 09:00
2. Clock Out: 17:00 (8 horas)

**Sexta-feira (05/11):**
1. Clock In: 09:00
2. Clock Out: 19:00 (10 horas) - 2 horas overtime

**Sábado (06/11):**
1. Clock In: 10:00
2. Clock Out: 15:00 (5 horas)

**Domingo (07/11):**
- Folga

**Segunda-feira (08/11):**
1. Criar Payroll Payment para período 01/11 - 07/11
2. Payment Date: 08/11/2025

**Cálculos Esperados:**
- Total Hours: 48 horas (8+9+8+8+10+5)
- Regular Hours: 40 horas (limite semanal)
- Overtime Hours: 8 horas (acima de 40h)
- Regular Pay: 40 × £18.00 = £720.00
- Overtime Pay: 8 × £18.00 × 1.5 = £216.00 (se overtime é 1.5x)
  - **Nota:** Verificar se backend aplica multiplicador de overtime
- Gross Amount: £720.00 + £216.00 = £936.00
- Advance Deduction: -£200.00
- Net Amount: £736.00

**Validações:**
- ✅ Todos os time entries registrados corretamente
- ✅ Vale criado e status PENDING
- ✅ Payroll calculation correto
- ✅ Vale deduzido e muda para DEDUCTED
- ✅ Payment criado com sucesso
- ✅ Net amount correto: £736.00 (ou valor conforme cálculo de overtime do backend)

---

### 6.2 Teste: Cancelamento e Recriação

**Objetivo:** Testar reversão completa de operações

**Passos:**
1. Crie um pagamento com dedução de vale (use fluxo 6.1)
2. Cancele o pagamento com razão válida
3. Verifique que o vale voltou para PENDING
4. Crie um novo pagamento para o mesmo período
5. Verifique que o vale é deduzido novamente

**Resultado Esperado:**
- ✅ Cancelamento reverte corretamente
- ✅ Vale pode ser deduzido novamente
- ✅ Novo pagamento calcula valores idênticos ao primeiro

---

### 6.3 Teste: Múltiplos Funcionários Simultaneamente

**Objetivo:** Processar folha de vários funcionários

**Passos:**
1. Crie time entries para 3 funcionários diferentes no mesmo período
2. Crie vales para 2 deles
3. Processe pagamento para cada um individualmente
4. Verifique a lista de payments

**Resultado Esperado:**
- ✅ Cada funcionário tem cálculo independente
- ✅ Vales deduzidos apenas do funcionário correto
- ✅ Lista mostra todos os pagamentos
- ✅ Summary totaliza corretamente

---

## 7. Testes de Validação e Edge Cases

### 7.1 Teste: Validações de Formulário

#### Employee Form
- [ ] First Name vazio → Erro
- [ ] Last Name vazio → Erro
- [ ] Email inválido → Erro
- [ ] Hourly Rate vazio → Erro
- [ ] Hourly Rate = 0 → Erro
- [ ] Hourly Rate negativo → Erro
- [ ] Weekly Hours < 1 → Erro
- [ ] Weekly Hours > 168 → Erro
- [ ] Start Date vazio → Erro
- [ ] End Date antes de Start Date → Erro (se validação implementada)

#### Time Entry Form
- [ ] Employee não selecionado → Erro
- [ ] Clock In vazio → Erro
- [ ] Clock Out antes de Clock In → Erro (verificar se backend valida)

#### Advance Form
- [ ] Employee não selecionado → Erro
- [ ] Amount vazio → Erro
- [ ] Amount ≤ 0 → Erro
- [ ] Advance Date vazio → Erro

#### Payroll Payment Form
- [ ] Employee não selecionado → Erro
- [ ] Period não selecionado → Erro
- [ ] Payment Date vazio → Erro
- [ ] Tentar criar payment sem time entries no período → Deve permitir mas Net = 0

---

### 7.2 Teste: Edge Cases

#### Time Entries
- [ ] Clock In e Clock Out no mesmo minuto → Total Hours = 0
- [ ] Time entry spanning midnight (23:00 - 01:00) → Verificar cálculo
- [ ] Deletar time entry usado em payroll payment → Deve permitir ou bloquear?

#### Advances
- [ ] Criar vale maior que o salário mensal estimado → Permitido
- [ ] Cancelar vale já deduzido → Botão não deve aparecer
- [ ] Múltiplos vales pendentes maior que gross → Não deduz nenhum

#### Payroll Payments
- [ ] Criar payment para período sem time entries → Total Hours = 0, Net = 0
- [ ] Criar 2 payments para mesmo funcionário e período → Deve permitir (é possível corrigir)
- [ ] Cancelar payment e verificar cash_flow → Verifica reversão
- [ ] Employee disabled → Pode criar payment? (provavelmente sim, dados históricos)

---

### 7.3 Teste: Performance e Limites

- [ ] Lista com 100+ employees → Paginação funciona
- [ ] Lista com 1000+ time entries → Paginação e filtros funcionam
- [ ] Funcionário com 50+ time entries → Aba carrega corretamente
- [ ] Funcionário com 20+ advances → Aba carrega corretamente
- [ ] Funcionário com 10+ payroll payments → Aba carrega corretamente

---

## 8. Testes de UI/UX

### 8.1 Teste: Responsividade

- [ ] Testar em desktop (1920x1080)
- [ ] Testar em tablet (768x1024)
- [ ] Testar em mobile (375x667)
- [ ] Tabelas com scroll horizontal em telas pequenas
- [ ] Formulários ajustam layout em mobile

### 8.2 Teste: Navegação

- [ ] Breadcrumbs funcionais (se implementado)
- [ ] Botão "Back" retorna à página anterior
- [ ] Links de ID levam aos detalhes corretos
- [ ] Menu lateral destaca a seção ativa

### 8.3 Teste: Feedback Visual

- [ ] Loading states durante fetch de dados
- [ ] Loading spinners em botões durante mutações
- [ ] Notificações de sucesso aparecem e desaparecem
- [ ] Notificações de erro são claras e descritivas
- [ ] Badges de status têm cores corretas
- [ ] Valores monetários sempre em GBP (£)
- [ ] Datas sempre em DD/MM/YYYY
- [ ] Horas sempre em formato decimal (8.00 hrs)

### 8.4 Teste: Acessibilidade

- [ ] Todos os botões têm labels claros
- [ ] Campos de formulário têm labels associados
- [ ] Erros de validação são anunciados
- [ ] Navegação por teclado funciona (Tab, Enter, Esc)
- [ ] Contraste de cores adequado
- [ ] Ícones têm tooltips explicativos

### 8.5 Teste: Modais e Confirmações

- [ ] Modal de confirmação aparece ao deletar
- [ ] Modal pode ser fechada com X ou Cancel
- [ ] Modal de cancel advance exige razão
- [ ] Modal de cancel payment exige razão
- [ ] Clicar fora da modal fecha (ou não, conforme design)

---

## 9. Checklist Final

### 9.1 Funcionalidades Principais

- [ ] ✅ Criar funcionário
- [ ] ✅ Editar funcionário
- [ ] ✅ Visualizar funcionário
- [ ] ✅ Desabilitar funcionário
- [ ] ✅ Habilitar funcionário
- [ ] ✅ Listar funcionários com filtros
- [ ] ✅ Clock In (criar time entry)
- [ ] ✅ Clock Out (finalizar time entry)
- [ ] ✅ Listar time entries com filtros
- [ ] ✅ Deletar time entry
- [ ] ✅ Criar vale
- [ ] ✅ Listar vales com filtros
- [ ] ✅ Cancelar vale
- [ ] ✅ Criar pagamento de folha
- [ ] ✅ Calcular pagamento automaticamente
- [ ] ✅ Deduzir vales automaticamente
- [ ] ✅ Visualizar detalhes do pagamento
- [ ] ✅ Cancelar pagamento
- [ ] ✅ Listar pagamentos com filtros

### 9.2 Integrações

- [ ] ✅ Time entries aparecem na página do funcionário
- [ ] ✅ Advances aparecem na página do funcionário
- [ ] ✅ Payments aparecem na página do funcionário
- [ ] ✅ Vales deduzidos aparecem no payment detail
- [ ] ✅ Status de vales atualiza após dedução
- [ ] ✅ Status de vales reverte após cancelamento de payment
- [ ] ✅ Notificações funcionam corretamente
- [ ] ✅ Cache do React Query invalida nas operações corretas

### 9.3 Validações e Segurança

- [ ] ✅ Formulários validam campos obrigatórios
- [ ] ✅ Valores monetários sempre positivos
- [ ] ✅ Datas válidas
- [ ] ✅ Email válido
- [ ] ✅ Hourly rate e weekly hours dentro dos limites
- [ ] ✅ Não é possível criar payroll sem employee
- [ ] ✅ Cancellation reason obrigatório

### 9.4 Performance

- [ ] ✅ Listas com paginação
- [ ] ✅ Filtros não travam a UI
- [ ] ✅ Dados carregam rapidamente (< 2s)
- [ ] ✅ Mutações completam rapidamente (< 1s)
- [ ] ✅ Não há memory leaks (testar em dev tools)

### 9.5 UI/UX

- [ ] ✅ Layout consistente em todas as páginas
- [ ] ✅ Cores e tipografia conforme design system
- [ ] ✅ Ícones claros e intuitivos
- [ ] ✅ Feedback visual para todas as ações
- [ ] ✅ Mensagens de erro claras
- [ ] ✅ Responsivo em mobile, tablet e desktop

---

## 10. Bugs Conhecidos e Melhorias Futuras

### Bugs a Reportar
Liste aqui bugs encontrados durante os testes:

1. [ ] Bug #1: Descrição
2. [ ] Bug #2: Descrição
3. [ ] Bug #3: Descrição

### Melhorias Sugeridas
Liste sugestões de melhorias:

1. [ ] Adicionar filtro de data range na lista de employees
2. [ ] Implementar cálculo automático de tax deductions (PAYE, NI)
3. [ ] Adicionar exportação de pay slip em PDF
4. [ ] Implementar busca por múltiplos campos (nome, email, job title)
5. [ ] Adicionar dashboard com métricas (total employees, total payroll, etc.)
6. [ ] Implementar autenticação e obter `cancelled_by` do usuário logado
7. [ ] Adicionar histórico de alterações (audit log)
8. [ ] Implementar bulk operations (criar múltiplos time entries)

---

## 11. Relatório de Testes

### Template de Relatório

**Data do Teste:** ___/___/_____
**Testador:** _________________
**Ambiente:** Desenvolvimento / Staging / Produção
**Versão do Frontend:** _________________
**Versão do Backend:** _________________

### Resumo
- Total de Testes Executados: _____
- Testes Passados: _____ (___%)
- Testes Falhados: _____ (___%)
- Bugs Críticos: _____
- Bugs Médios: _____
- Bugs Baixos: _____

### Seções Testadas
- [ ] Employees: _____ / _____ (passed / total)
- [ ] Time Entries: _____ / _____ (passed / total)
- [ ] Advances: _____ / _____ (passed / total)
- [ ] Payroll Payments: _____ / _____ (passed / total)
- [ ] Integração: _____ / _____ (passed / total)
- [ ] Validações: _____ / _____ (passed / total)
- [ ] UI/UX: _____ / _____ (passed / total)

### Observações Gerais
_Espaço para comentários e observações do testador_

---

**Fim do Manual de Testes**

*Para dúvidas ou sugestões sobre este manual, entre em contato com a equipe de desenvolvimento.*
