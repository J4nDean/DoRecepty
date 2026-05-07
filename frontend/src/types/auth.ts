export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  pesel: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
