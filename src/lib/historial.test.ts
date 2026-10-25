import { describe, expect, test } from "bun:test";
import { diagnosticar, extraerObligaciones } from "./historial";

describe("puntaje estimado transparente", () => {
  test("sin mora y con carga sana el puntaje queda en 850 y lo explica", () => {
    const d = diagnosticar(
      [{ entidad: "Banco", tipo: "Consumo", saldo: 1_000_000, cuota: 300_000, diasMora: 0 }],
      3_000_000,
    );
    expect(d.puntaje).toBe(850);
    expect(d.nivel).toBe("Excelente");
    expect(d.factores.some((f) => f.includes("no te resta"))).toBe(true);
  });

  test("una mora de 90 días resta 148 puntos y el desglose lo muestra", () => {
    const d = diagnosticar(
      [{ entidad: "Banco", tipo: "Consumo", saldo: 1_000_000, cuota: 100_000, diasMora: 90 }],
      3_000_000,
    );
    // 40 por la deuda en mora + 90 × 1,2 por los días = 148.
    expect(d.puntaje).toBe(850 - 148);
    expect(d.factores.some((f) => f.includes("−148"))).toBe(true);
  });

  test("el extractor no inventa la cuota cuando el reporte no la trae", () => {
    const [o] = extraerObligaciones("Bancolombia Crédito de consumo $ 5.000.000 al día");
    expect(o?.cuota).toBe(0);
    expect(o?.cuotaEstimada).toBe(true);
  });
});
