export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  active: boolean;
  createdAt?: string;
}
