export interface Estudiante {
  id: string;
  nombre: string;
  apellido?: string;
  studentId?: string;
  faculty?: string;
  carrera: string;
  correo: string;
  telefono: string;
  fotoUrl?: string;
  semestre?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  mensaje?: string;
  error?: string;
  data?: T;
  total?: number;
  url?: string;
}

export interface UsuarioDocente {
  id: string;
  nombre: string;
  usuario: string;
  rol: string;
}

export interface LoginResponse {
  success: boolean;
  mensaje?: string;
  token?: string;
  usuario?: UsuarioDocente;
  error?: string;
}
