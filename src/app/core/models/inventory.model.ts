export type MovementType =
  | 'ENTRADA'
  | 'SALIDA_VENTA'
  | 'SALIDA_RESERVA'
  | 'LIBERACION_RESERVA'
  | 'AJUSTE'
  | 'DEVOLUCION';

export interface InventoryItem {
  id: string;
  sucursal_id: string;
  variante_id: string;
  stock_actual: number;
  stock_reservado: number;
  stock_minimo: number;
  stock_disponible: number;
  ubicacion?: string | null;
  alerta?: 'CRITICO' | 'BAJO' | 'EXCEDENTE' | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryUpdate {
  stock_minimo?: number;
  ubicacion?: string;
}

export interface ReceptionItem {
  variante_id: string;
  cantidad: number;
}

export interface ReceptionCreate {
  sucursal_id: string;
  productos: ReceptionItem[];
  factura?: string;
  nota?: string;
}

export interface ReceptionResponse {
  sucursal_id: string;
  items_procesados: number;
  message: string;
}

export interface StockAdjustment {
  inventario_id: string;
  cantidad: number;
  nota?: string;
}

export interface InventoryMovement {
  id: string;
  inventario_id: string;
  tipo: MovementType;
  cantidad: number;
  stock_antes: number;
  stock_despues: number;
  referencia?: string | null;
  nota?: string | null;
  usuario_id?: string | null;
  created_at: string;
}

export interface StockAlert {
  inventario_id: string;
  sucursal: string;
  variante_sku: string;
  producto_nombre: string;
  talla: string;
  color: string;
  stock_actual: number;
  stock_minimo: number;
  stock_disponible: number;
  nivel: 'CRITICO' | 'BAJO' | 'EXCEDENTE';
}

export interface AvailabilityItem {
  producto_id: string;
  producto_nombre: string;
  talla: string;
  color: string;
  sku: string;
  sucursal_id: string;
  sucursal: string;
  ciudad: string;
  stock_disponible: number;
  precio: number;
}
