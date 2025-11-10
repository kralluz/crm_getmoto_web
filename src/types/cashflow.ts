// Direção da movimentação conforme schema da API
export type CashFlowDirection = 'entrada' | 'saida';

// Tipos legados para compatibilidade (mapeados internamente)
export type TransactionType = 'INCOME' | 'EXPENSE';

export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'BANK_TRANSFER'
  | 'CHECK';

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategorySummary {
  category: string;
  type: TransactionType;
  total: number;
  count: number;
}

// Interface baseada no schema real da API
export interface CashFlowTransaction {
  cash_flow_id: number | string;
  service_order_id?: number | null;
  service_realized_id?: number | null;
  service_product_id?: number | null;
  purchase_order_id?: number | null;
  expense_id?: number | null;
  amount: number;
  direction: CashFlowDirection;
  occurred_at: string;
  note?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Dados para criar movimentação conforme API
export interface CreateCashFlowData {
  service_order_id?: number | null;
  service_realized_id?: number | null;
  service_product_id?: number | null;
  amount: number;
  direction: CashFlowDirection;
  occurred_at?: string;
  note?: string | null;
  is_active?: boolean;
}

// Mapeamento de tipo para direção
export const mapTypeToDirection = (type: TransactionType): CashFlowDirection => {
  return type === 'INCOME' ? 'entrada' : 'saida';
};

export const mapDirectionToType = (direction: CashFlowDirection): TransactionType => {
  return direction === 'entrada' ? 'INCOME' : 'EXPENSE';
};

// Interface legada para compatibilidade com código existente
export interface CreateTransactionData {
  userId?: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date?: string;
  paymentId?: string;
}

// Tipos de origem de transação
export type TransactionSource =
  | 'service_order'
  | 'service_realized'
  | 'service_product'
  | 'purchase_order'
  | 'expense'
  | 'orphan';

// Helper para identificar a origem de uma transação
export const getTransactionSource = (
  transaction: CashFlowTransaction
): TransactionSource => {
  if (transaction.service_order_id) return 'service_order';
  if (transaction.service_realized_id) return 'service_realized';
  if (transaction.service_product_id) return 'service_product';
  if (transaction.purchase_order_id) return 'purchase_order';
  if (transaction.expense_id) return 'expense';
  return 'orphan';
};

// Helper para obter ID da origem
export const getTransactionSourceId = (
  transaction: CashFlowTransaction
): number | null => {
  const source = getTransactionSource(transaction);
  switch (source) {
    case 'service_order':
      return transaction.service_order_id
        ? Number(transaction.service_order_id)
        : null;
    case 'service_realized':
      return transaction.service_realized_id
        ? Number(transaction.service_realized_id)
        : null;
    case 'service_product':
      return transaction.service_product_id
        ? Number(transaction.service_product_id)
        : null;
    case 'purchase_order':
      return transaction.purchase_order_id
        ? Number(transaction.purchase_order_id)
        : null;
    case 'expense':
      return transaction.expense_id ? Number(transaction.expense_id) : null;
    default:
      return null;
  }
};
