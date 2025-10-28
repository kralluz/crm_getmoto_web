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
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date?: string;
  paymentId?: string;
}
