export interface RecomendacionFinanciera {
  titulo: string;
  analisis: string;
  accion: string;
}

export interface ResultadoRecomendaciones {
  resumen: string;
  alertas: string[];
  recomendaciones: RecomendacionFinanciera[];
}
