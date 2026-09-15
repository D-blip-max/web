export interface Supplier {
  id: string;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreate {
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo?: boolean;
}

export interface SupplierUpdate {
  nombre?: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo?: boolean;
}
