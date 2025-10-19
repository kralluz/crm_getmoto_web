export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color?: string;
  clientId: string;
  clientName?: string;
  active: boolean;
}
