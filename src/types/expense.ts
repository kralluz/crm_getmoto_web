export type ExpenseCategory =
  | 'salary'
  | 'rent'
  | 'utilities'
  | 'maintenance'
  | 'taxes'
  | 'supplies'
  | 'other';

export interface Expense {
  expense_id: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  is_active: boolean;
  cancelled_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
}

export interface UpdateExpenseData {
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  expense_date?: string;
}

export interface CancelExpenseData {
  cancelled_by: number;
  cancellation_reason?: string;
}
