export interface TimeEntry {
  time_entry_id: number;
  employee_id: number;
  clock_in: string;
  clock_out?: string | null;
  total_hours?: number | null;
  regular_hours?: number | null;
  overtime_hours?: number | null;
  payroll_payment_id?: number | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  created_by?: number | null;
  // Dados do funcionário (quando incluído)
  employee?: {
    employee_id: number;
    first_name: string;
    last_name: string;
  };
}

export interface CreateTimeEntryData {
  employee_id: number;
  clock_in: string;
  clock_out?: string | null;
  total_hours?: number | null;
  notes?: string | null;
}

export interface UpdateTimeEntryData {
  employee_id?: number;
  clock_in?: string;
  clock_out?: string | null;
  total_hours?: number | null;
  notes?: string | null;
}

export interface WeeklySummary {
  entries: TimeEntry[];
  summary: {
    total_hours: number;
    regular_hours: number;
    overtime_hours: number;
  };
}
