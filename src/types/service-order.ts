export interface ServiceOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName?: string;
  vehicleId: string;
  vehiclePlate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  totalAmount: number;
  createdAt: string;
  completedAt?: string;
}
