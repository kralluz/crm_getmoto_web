export type ServiceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'WAITING_PARTS';

export interface Service {
  id: string;
  customerId: string;
  motorcycleId: string;
  userId: string;
  description: string;
  diagnosis?: string;
  status: ServiceStatus;
  startDate: string;
  estimatedEndDate?: string;
  endDate?: string;
  laborCost: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  motorcycle?: {
    id: string;
    brand: string;
    model: string;
    plate: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

export interface CreateServiceData {
  customerId: string;
  motorcycleId: string;
  userId: string;
  description: string;
  diagnosis?: string;
  status?: ServiceStatus;
  startDate?: string;
  estimatedEndDate?: string;
  laborCost?: number;
  notes?: string;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  endDate?: string;
  totalCost?: number;
}
