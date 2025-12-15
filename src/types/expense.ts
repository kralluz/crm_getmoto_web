export type ExpenseCategory =
  | 'salary'
  | 'rent'
  | 'utilities'
  | 'maintenance'
  | 'taxes'
  | 'supplies'
  | 'purchase' // Ordens de compra
  | 'other';

export type ExpenseType = 
  | 'expense' // Despesa operacional
  | 'purchase_order' // Ordem de compra
  | 'payroll' // Folha de pagamento
  | 'employee_advance' // Adiantamento
  | 'other'; // Outros

export interface Expense {
  expense_id: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  notes?: string;
  is_active: boolean;
  cancelled_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

// Nova interface para saídas unificadas (todas as saídas do cash_flow)
export interface UnifiedOutflow {
  cash_flow_id: number;
  type: ExpenseType;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  reference_id: number | null;
  is_active: boolean;
  is_cancelled: boolean;
  cancelled_at?: string | null;
  cancelled_by?: number | null;
  cancellation_reason?: string | null;
  created_at: string;
  original_data?: {
    expense?: Expense | null;
    purchase_order?: any;
    payroll_payment?: any;
    employee_advance?: any;
  };
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
