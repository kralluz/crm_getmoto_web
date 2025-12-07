export interface PayrollPayment {
  payment_id: number;
  employee_id: number;
  period_start: string;
  period_end: string;
  payment_date: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate_pence: number;
  regular_amount_pence: number;
  overtime_amount_pence: number;
  bonuses_pence: number;
  deductions_pence: number;
  advances_deducted_pence: number;
  gross_amount_pence: number;
  net_amount_pence: number;
  notes?: string | null;
  is_cancelled: boolean;
  cancelled_at?: string | null;
  cancelled_by?: number | null;
  cancellation_reason?: string | null;
  is_active: boolean;
  created_at: string;
  created_by?: number | null;
  // Dados do funcionário (quando incluído)
  employee?: {
    employee_id: number;
    first_name: string;
    last_name: string;
  };
  // Vales deduzidos (quando incluído)
  payment_advances?: Array<{
    id: number;
    payment_id: number;
    advance_id: number;
    amount_pence: number;
    advance: {
      advance_id: number;
      advance_date: string;
      amount_pence: number;
      reason?: string | null;
    };
  }>;
  // Cash flow entries (quando incluído)
  cash_flow?: any[];
}

export interface CreatePayrollPaymentData {
  employee_id: number;
  period_start: string;
  period_end: string;
  // payment_date removed - backend uses today's date automatically
  regular_hours: number;
  overtime_hours?: number;
  bonuses_pence?: number;
  deductions_pence?: number;
  notes?: string | null;
}

export interface PaidPeriod {
  payment_id: number;
  period_start: string;
  period_end: string;
  payment_date: string;
  gross_amount_pence: number;
  net_amount_pence: number;
  regular_hours: number;
  overtime_hours: number;
}

export interface CancelPaymentData {
  cancelled_by: number;
  cancellation_reason: string;
}
