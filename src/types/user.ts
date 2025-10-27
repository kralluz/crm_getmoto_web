export type UserRole = 'ADMIN' | 'MANAGER' | 'MECHANIC' | 'ATTENDANT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
}

export interface ChangePasswordInput {
  newPassword: string;
  confirmPassword: string;
}
