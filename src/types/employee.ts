export type ContractType = 'HOURLY' | 'SALARY';

export interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  national_insurance?: string | null;
  address?: string | null;
  job_title: string;
  hourly_rate_pence: number;
  contract_type: ContractType;
  start_date: string;
  end_date?: string | null;
  weekly_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  // Contadores (quando incluído nas queries)
  _count?: {
    payroll_payments: number;
    employee_advances: number;
    time_entries: number;
  };
}

export interface CreateEmployeeData {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  national_insurance?: string | null;
  address?: string | null;
  job_title: string;
  hourly_rate_pence: number;
  contract_type?: ContractType;
  start_date: string;
  end_date?: string | null;
  weekly_hours?: number;
}

export interface UpdateEmployeeData {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  national_insurance?: string | null;
  address?: string | null;
  job_title?: string;
  hourly_rate_pence?: number;
  contract_type?: ContractType;
  start_date?: string;
  end_date?: string | null;
  weekly_hours?: number;
}

// Helper para converter pence para pounds
export const penceToPounds = (pence: number): number => {
  return pence / 100;
};

// Helper para converter pounds para pence
export const poundsToPence = (pounds: number): number => {
  return Math.round(pounds * 100);
};

// Helper para formatar como moeda UK
export const formatUKCurrency = (pence: number): string => {
  const pounds = penceToPounds(pence);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pounds);
};
