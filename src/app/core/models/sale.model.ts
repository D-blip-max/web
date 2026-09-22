export type SaleType = 'PRESENCIAL' | 'DIGITAL';
export type SaleStatus = 'PENDIENTE_PAGO' | 'COMPLETADA' | 'CANCELADA';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'QR' | 'PAYPAL';

export interface SaleItemCreate {
  variante_id: string;
  cantidad: number;
  precio_unitario?: number;
  reserva_id?: string;
}

export interface PaymentInfo {
  metodo: PaymentMethod;
  monto_recibido?: number;
  referencia?: string;
}

export interface PresencialSaleCreate {
  sucursal_id: string;
  cliente_id?: string;
  items: SaleItemCreate[];
  pago: PaymentInfo;
  nota?: string;
}

export interface DigitalSaleCreate {
  sucursal_id: string;
  items: SaleItemCreate[];
  token_pago?: string;
  nota?: string;
}

export interface SaleCancel {
  motivo: string;
}

export interface SaleDetail {
  id: string;
  venta_id: string;
  variante_id: string;
  variante_sku?: string | null;
  producto_nombre?: string | null;
  talla?: string | null;
  color?: string | null;
  reserva_id?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface Sale {
  id: string;
  numero_recibo: string;
  tipo: SaleType;
  estado: SaleStatus;
  sucursal_id: string;
  sucursal_nombre?: string | null;
  sucursal_ciudad?: string | null;
  cliente_id?: string | null;
  cliente_nombre?: string | null;
  cajero_id?: string | null;
  cajero_nombre?: string | null;
  metodo_pago: PaymentMethod;
  referencia_pago?: string | null;
  monto_total: number;
  impuesto_iva?: number;
  monto_neto?: number;
  monto_recibido?: number | null;
  cambio?: number | null;
  nota?: string | null;
  motivo_cancelacion?: string | null;
  detalles: SaleDetail[];
  created_at: string;
  updated_at: string;
}

export interface SalesSummaryReport {
  total_ventas: number;
  ingresos_totales: number;
  ticket_promedio: number;
  ventas_efectivo: number;
  ventas_tarjeta: number;
  ventas_qr: number;
  total_iva?: number;
  ganancia_neta?: number;
}

export interface TopProductReport {
  producto_nombre: string;
  variante_sku: string;
  talla: string;
  color: string;
  unidades_vendidas: number;
  ingresos_generados: number;
}
