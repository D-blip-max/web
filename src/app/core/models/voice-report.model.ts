export interface VoiceReportQueryRequest {
  pregunta: string;
  limite?: number;
}

export interface VoiceReportQueryResponse {
  pregunta: string;
  interpretacion: string;
  sql_generado: string;
  columnas: string[];
  filas: Record<string, any>[];
  total_filas: number;
  tiempo_ms: number;
}
