import { describe, expect, test } from "bun:test";
import { interesMora, simular, TASA_MORA_MENSUAL } from "./finanzas";

describe("reglas financieras", () => {
  test("la mora usa la tasa estimada del 2,1% mensual (1,5× la ordinaria típica)", () => {
    expect(TASA_MORA_MENSUAL).toBe(0.021);
    // Cuota de $100.000 con 30 días de mora = un mes completo de recargo.
    expect(interesMora(100_000, 30, TASA_MORA_MENSUAL)).toBeCloseTo(2_100);
    expect(interesMora(100_000, 0, TASA_MORA_MENSUAL)).toBe(0);
  });

  test("el costo anual aproximado anualiza de forma simple intereses + comisión", () => {
    const r = simular({
      monto: 1_000_000,
      plazo: 12,
      tasaMensual: 0.02,
      comisionPct: 0.01,
      ingresos: 3_000_000,
      gastos: 1_000_000,
      deudaActual: 0,
    });
    const esperado = ((r.totalIntereses + r.comisionApertura) / 1_000_000) * (12 / 12);
    expect(r.costoTotalAnual).toBeCloseTo(esperado, 10);
    // Con 12 meses el costo anual queda cerca del costo total del crédito (~14,5%:
    // intereses sobre saldo decreciente + 1% de comisión).
    expect(r.costoTotalAnual).toBeGreaterThan(0.13);
    expect(r.costoTotalAnual).toBeLessThan(0.16);
  });
});
