import { Category } from './category.model';

export interface ProductVariant {
  id: string;
  producto_id: string;
  talla: string;
  color: string;
  sku: string;
  precio_extra: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantCreate {
  talla: string;
  color: string;
  sku?: string;
  precio_extra?: number;
  activo?: boolean;
}

export interface ProductVariantUpdate {
  talla?: string;
  color?: string;
  sku?: string;
  precio_extra?: number;
  activo?: boolean;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  precio_base: number;
  categoria_id: string;
  categoria?: Category;
  temporada?: string | null;
  proveedor?: string | null;
  activo: boolean;
  variantes: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  precio_base: number;
  categoria_id: string;
  temporada?: string | null;
  proveedor?: string | null;
  activo?: boolean;
  variantes?: ProductVariantCreate[];
}

export interface ProductUpdate {
  nombre?: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  precio_base?: number;
  categoria_id?: string;
  temporada?: string | null;
  proveedor?: string | null;
  activo?: boolean;
}
