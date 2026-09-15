export interface Season {
  id: string;
  nombre: string;
  anio: number;       // API envía "año", el servicio lo mapea a "anio"
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonCreate {
  nombre: string;
  anio: number;       // se enviará como "año" al API en el servicio
  fecha_inicio: string;
  fecha_fin: string;
  activa?: boolean;
}

export interface SeasonUpdate {
  nombre?: string;
  anio?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activa?: boolean;
}
