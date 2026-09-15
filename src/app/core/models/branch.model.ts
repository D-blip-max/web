export interface Branch {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono?: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchCreate {
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono?: string | null;
  activa?: boolean;
}

export interface BranchUpdate {
  nombre?: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string | null;
  activa?: boolean;
}
