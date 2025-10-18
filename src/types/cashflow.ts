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

export interface CashFlowTransaction {
  id: string;
  paymentId?: string;
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date?: string;
  paymentId?: string;
}
