export interface Obligacion {
  entidad: string;
  tipo: string;
  saldo: number;
  cuota: number;
  diasMora: number;
  /** true cuando el reporte no traía cuota y el usuario debe confirmarla. */
  cuotaEstimada?: boolean;
}

export interface Diagnostico {
  totalDeuda: number;
  totalCuotas: number;
  porcentajeIngreso: number;
  enMora: number;
  sinCuota: number;
  puntaje: number;
  nivel: "Excelente" | "Aceptable" | "En alerta";
  /** Explicación de qué sube o baja el puntaje estimado. */
  factores: string[];
  acciones: string[];
}

const num = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

/** Lee texto de un reporte/extracto: líneas con entidad y montos en pesos. */
export function extraerObligaciones(texto: string): Obligacion[] {
  const res: Obligacion[] = [];
  for (const linea of texto.split(/\n+/)) {
    const montos = linea.match(/\$\s?[\d.,]{4,}/g);
    if (!montos || montos.length === 0) continue;
    const entidad = (linea.split("$")[0] ?? "").replace(/[|:;-]+$/, "").trim().slice(0, 40) || "Entidad";
    const mora = linea.match(/(\d{1,3})\s*d[ií]as/i);
    const tipo = /tarjeta/i.test(linea) ? "Tarjeta de crédito" : /micro/i.test(linea) ? "Microcrédito" : /veh/i.test(linea) ? "Vehículo" : "Consumo";
    // Si el reporte no trae cuota, no la inventamos: queda en 0 y marcada para revisión.
    const segundoMonto = montos[1];
    const sinCuota = !segundoMonto;
    res.push({
      entidad,
      tipo,
      saldo: num(montos[0] ?? ""),
      cuota: sinCuota ? 0 : num(segundoMonto ?? ""),
      diasMora: mora ? Number(mora[1]) : 0,
      cuotaEstimada: sinCuota,
    });
  }
  return res;
}

export function diagnosticar(obligaciones: Obligacion[], ingreso: number): Diagnostico {
  const totalDeuda = obligaciones.reduce((a, o) => a + o.saldo, 0);
  const totalCuotas = obligaciones.reduce((a, o) => a + o.cuota, 0);
  const porcentajeIngreso = ingreso > 0 ? totalCuotas / ingreso : 1;
  const enMora = obligaciones.filter((o) => o.diasMora > 0).length;
  const sinCuota = obligaciones.filter((o) => o.cuota <= 0).length;
  const peorMora = Math.max(0, ...obligaciones.map((o) => o.diasMora));

  // Puntaje estimado propio de CUENTACLARA (escala 300–850). No es el puntaje oficial
  // de Datacrédito ni TransUnion: es una guía educativa calculada con estos factores.
  const castigoCarga = Math.max(0, porcentajeIngreso - 0.3) * 400;
  const castigoMora = enMora * 40 + Math.min(peorMora, 120) * 1.2;
  let puntaje = 850 - castigoCarga - castigoMora;
  puntaje = Math.round(Math.max(300, Math.min(850, puntaje)));
  const nivel = puntaje >= 750 ? "Excelente" : puntaje >= 650 ? "Aceptable" : "En alerta";

  const factores: string[] = ["Partes de 850 puntos, el mejor escenario posible."];
  if (castigoCarga > 0)
    factores.push(
      `Tus cuotas usan el ${Math.round(porcentajeIngreso * 100)}% de tu ingreso (lo sano es hasta 30%): −${Math.round(castigoCarga)} puntos.`,
    );
  else factores.push("Tus cuotas usan menos del 30% de tu ingreso: eso no te resta puntos.");
  if (castigoMora > 0)
    factores.push(
      `Tienes ${enMora} deuda(s) en mora (la peor de ${peorMora} días): −${Math.round(castigoMora)} puntos.`,
    );
  else factores.push("No tienes deudas en mora: eso no te resta puntos.");

  const acciones: string[] = [];
  if (sinCuota > 0) acciones.push(`A ${sinCuota} deuda(s) les falta la cuota mensual: escríbela arriba para que el porcentaje de tu ingreso sea exacto.`);
  if (enMora > 0) acciones.push(`Ponte al día primero con las ${enMora} deuda(s) en mora: cada día de atraso baja tu puntaje.`);
  if (peorMora >= 60) acciones.push("Llama a la entidad y pide un acuerdo de pago. Por la Ley de Borrón y Cuenta Nueva, al pagar el reporte negativo dura el doble de la mora (máximo 4 años).");
  if (porcentajeIngreso > 0.4) acciones.push("Más del 40% de tu ingreso se va en cuotas. Evita pedir crédito nuevo y considera unir deudas en una de menor tasa.");
  else if (porcentajeIngreso > 0.3) acciones.push("Estás cerca del límite sano (30%). Abona a la deuda más cara para liberar espacio.");
  if (obligaciones.some((o) => o.tipo === "Tarjeta de crédito")) acciones.push("Paga el total de la tarjeta cada mes; pagar solo el mínimo es la forma más cara de financiarte.");
  if (acciones.length === 0) acciones.push("Vas muy bien. Mantén tus pagos puntuales y guarda un fondo de emergencia de 3 meses de gastos.");

  return { totalDeuda, totalCuotas, porcentajeIngreso, enMora, sinCuota, puntaje, nivel, factores, acciones };
}

export const REPORTE_EJEMPLO = `Bancolombia Tarjeta de crédito $ 3.200.000 $ 280.000 al día
Davivienda Crédito libre inversión $ 12.500.000 $ 620.000 al día
Bancamía Microcrédito $ 2.100.000 $ 190.000 mora 35 días`;
