export type ReservationStatus =
  | 'PENDIENTE'
  | 'PREPARADA'
  | 'RECOGIDA'
  | 'CANCELADA'
  | 'EXPIRADA'
  | 'COMPLETADA';

export interface ReservationItemCreate {
  variante_id: string;
  cantidad: number;
}

export interface ReservationCreate {
  sucursal_id: string;
  fecha_hora_esperada: string;
  items: ReservationItemCreate[];
  nota?: string;
}

export interface ReservationDetail {
  id: string;
  reserva_id: string;
  variante_id: string;
  variante_sku?: string | null;
  producto_nombre?: string | null;
  talla?: string | null;
  color?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  codigo: string;
  cliente_id: string;
  cliente_nombre?: string | null;
  cliente_email?: string | null;
  sucursal_id: string;
  sucursal_nombre?: string | null;
  sucursal_ciudad?: string | null;
  estado: ReservationStatus;
  fecha_hora_esperada: string;
  fecha_expiracion: string;
  fecha_recogida?: string | null;
  total_estimado: number;
  nota?: string | null;
  activo: boolean;
  detalles: ReservationDetail[];
  created_at: string;
  updated_at: string;
}

export interface ExpireReservationsResponse {
  total_expiradas: number;
  message: string;
}
