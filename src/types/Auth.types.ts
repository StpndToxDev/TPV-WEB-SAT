export interface Usuario {
  username: string;
  nombre: string;
}

export interface LoginResponse {
  primerLogin: boolean;
  username: string;
  nombre: string;
}

export interface VerificarUsuarioResponse {
  existe: boolean;
  activo: boolean;
  primerLogin: boolean;
  nombre: string;
}