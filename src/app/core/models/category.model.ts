export interface Category {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  nombre: string;
  descripcion?: string | null;
  activa?: boolean;
}

export interface CategoryUpdate {
  nombre?: string;
  descripcion?: string | null;
  activa?: boolean;
}
