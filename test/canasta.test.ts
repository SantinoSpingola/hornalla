import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
/* eslint-disable @typescript-eslint/no-explicit-any */
const C = require("../web/canasta-lib.js") as any;
const REF = require("../web/referencia.js") as any;

function loadData() {
  const w: Record<string, unknown> = {};
  (globalThis as Record<string, unknown>).window = w;
  delete require.cache[require.resolve("../web/canasta-data.js")];
  require("../web/canasta-data.js");
  delete (globalThis as Record<string, unknown>).window;
  return w.CANASTA_DATA as any;
}
const data = loadData();
const last = data.periodos.length - 1;

/** Convierte un hogar de ejemplo del INDEC en una selección { 'a30m': n }. */
function selDe(h: any) {
  const sel: Record<string, number> = {};
  for (const [id, sx] of Object.entries<any>(h.miembros)) for (const [s, n] of Object.entries<number>(sx)) sel[id + s] = (sel[id + s] ?? 0) + n;
  return sel;
}

describe("formato (es-AR)", () => {
  const F = require("../web/formato.js") as any;
  it("períodos, números, pesos y porcentajes", () => {
    expect(F.periodoLabel("202609")).toBe("sep 2026");
    expect(F.periodoLabel("202609", true)).toBe("septiembre de 2026");
    expect(F.num(1234.5, 1)).toBe("1.234,5");
    expect(F.num(null, 1)).toBe("s/d");
    expect(F.pesos(776939.21)).toBe("$ 776.939");
    expect(F.pct(40)).toBe("+40 %");
    expect(F.pct(-68.2)).toBe("−68 %");
    expect(F.pct(0.2)).toBe("0 %");
  });
});

describe("tabla oficial de adultos equivalentes (Cuadro 4)", () => {
  it("tiene los 23 grupos y coeficientes en rango plausible", () => {
    expect(REF.equivalencias).toHaveLength(23);
    for (const e of REF.equivalencias) {
      expect(e.m).toBeGreaterThan(0.3);
      expect(e.v).toBeLessThan(1.1);
    }
  });
  it("varón adulto de 30 a 45 años es la unidad de referencia (1,00)", () => {
    expect(C.coef("a30", "v")).toBe(1);
  });
  it("hasta los 9 años no hay diferencia entre sexos y crece con la edad", () => {
    for (let i = 0; i <= 9; i++) expect(C.coef("p" + i, "m")).toBe(C.coef("p" + i, "v"));
    for (let i = 1; i <= 9; i++) expect(C.coef("p" + i, "m")).toBeGreaterThan(C.coef("p" + (i - 1), "m"));
  });
  it("valores puntuales transcriptos del informe del INDEC", () => {
    expect(C.coef("p0", "m")).toBe(0.35);
    expect(C.coef("e15", "v")).toBe(1.0);
    expect(C.coef("e16", "v")).toBe(1.03);
    expect(C.coef("e17", "v")).toBe(1.04);
    expect(C.coef("a61", "m")).toBe(0.67);
    expect(C.coef("a76", "v")).toBe(0.74);
  });
  it("los tres hogares de ejemplo del INDEC suman 2,46 / 3,09 / 3,25", () => {
    for (const h of REF.hogaresEjemplo) expect(C.totales(selDe(h)).ae).toBeCloseTo(h.ae, 10);
  });
});

describe("control contra los valores publicados por la API del INDEC", () => {
  it("CBA × adultos equivalentes reproduce el CBA de cada hogar (±1 centavo de redondeo)", () => {
    for (const h of REF.hogaresEjemplo) {
      const esperado = C.costoMensual(data.cba[last], C.totales(selDe(h)).ae, 30, 100);
      expect(Math.abs(esperado - data.hogares[h.id].cba)).toBeLessThan(0.05);
    }
  });
  it("lo mismo con la CBT (usando el coeficiente de Engel ya incluido en la CBT del adulto equivalente)", () => {
    for (const h of REF.hogaresEjemplo) {
      const esperado = data.cbt[last] * C.totales(selDe(h)).ae;
      expect(Math.abs(esperado - data.hogares[h.id].cbt)).toBeLessThan(0.05);
    }
  });
  it("datos generados: períodos ordenados, mismo largo y último dato presente", () => {
    expect([...data.periodos].sort()).toEqual(data.periodos);
    for (const k of ["cba", "cbt", "cbaVM", "cbaVIA", "ice"]) expect(data[k]).toHaveLength(data.periodos.length);
    expect(data.cba[last]).toBeGreaterThan(0);
    expect(data.cbt[last]).toBeGreaterThan(data.cba[last]);
  });
});

describe("cálculo", () => {
  const cba = 239058.22;
  it("un adulto equivalente por 30 días al 100 % cuesta exactamente la CBA", () => {
    expect(C.costoMensual(cba, 1, 30, 100)).toBeCloseTo(cba, 6);
  });
  it("es proporcional a los días y a la porción", () => {
    expect(C.costoMensual(cba, 10, 15, 100)).toBeCloseTo(C.costoMensual(cba, 10, 30, 100) / 2, 6);
    expect(C.costoMensual(cba, 10, 30, 50)).toBeCloseTo(C.costoMensual(cba, 10, 30, 100) / 2, 6);
  });
  it("totales: personas y adultos equivalentes; ignora claves inválidas y cantidades basura", () => {
    const t = C.totales({ a30v: 2, a30m: 3, p5m: 4, zzz: 9, a30x: 3, p3m: -5, p4m: "abc", p6m: 2.9 });
    expect(t.personas).toBe(2 + 3 + 4 + 2);
    expect(t.ae).toBeCloseTo(2 * 1.0 + 3 * 0.77 + 4 * 0.6 + 2 * 0.64, 10);
    expect(C.totales({}).personas).toBe(0);
  });
  it("tope de cantidad y validación de días y porción", () => {
    expect(C.totales({ a30v: 10 ** 9 }).personas).toBe(9999);
    expect(C.validar(0, 0)).toEqual({ dias: 1, porcion: 1 });
    expect(C.validar(99, 500)).toEqual({ dias: 31, porcion: 100 });
    expect(C.validar("x", "y")).toEqual({ dias: 30, porcion: 100 });
  });
  it("costo por persona por día", () => {
    const t = C.totales({ a30v: 1 });
    expect(C.costoPersonaDia(cba, t.ae, t.personas, 30, 100)).toBeCloseTo(cba / 30, 6);
    expect(C.costoPersonaDia(cba, 0, 0, 30, 100)).toBeNull();
  });
  it("días que cubre una donación: monto ÷ costo diario de ese perfil", () => {
    const dia = (cba * 0.6) / 30;
    expect(C.diasQueCubre(dia * 10, cba, 0.6, 100)).toBeCloseTo(10, 8);
    expect(C.diasQueCubre(dia * 10, cba, 0.6, 50)).toBeCloseTo(20, 8);
  });
  it("lista de compras: un adulto equivalente 30 días = composición oficial (pan 6,75 kg, leche 9,27 kg)", () => {
    const l = C.lista(1, 30, 100);
    const pan = l.find((x: any) => x.id === "pan");
    expect(pan.cantidad).toBeCloseTo(6.75, 8);
    expect(pan.unidad).toBe("kg");
    const cafe = l.find((x: any) => x.id === "cafe");
    expect(cafe.cantidad).toBeCloseTo(30, 8);
    expect(cafe.unidad).toBe("g");
    const bebAlc = l.find((x: any) => x.id === "beb_alc");
    expect(bebAlc.unidad).toBe("litros");
    expect(l).toHaveLength(30); // los 30 componentes del Cuadro 3 del INDEC
    // escala lineal con el grupo
    expect(C.lista(10, 30, 100).find((x: any) => x.id === "pan").cantidad).toBeCloseTo(67.5, 8);
  });
  it("texto de WhatsApp: usa solo números calculados y no inventa", () => {
    const t = C.textoWhatsApp({ org: "Merendero Los Pibes", personas: 40, dias: 20, porcion: 100, periodo: "202609", costo: 1234567, porPersonaDia: 1543, variacionAnual: 40, ejemplo: { monto: 50000, etq: "una niña o un niño de 5 años", dias: 6.97 }, url: "https://ejemplo.org" });
    expect(t).toContain("*Merendero Los Pibes* da de comer a 40 personas");
    expect(t).toContain("septiembre de 2026");
    expect(t).toContain("subió 40 %");
    expect(t).toContain("https://ejemplo.org");
    expect(C.textoWhatsApp({ personas: 1, dias: 30, porcion: 50, periodo: "202609", costo: 1, porPersonaDia: 1 })).toContain("Nuestro comedor");
  });
});
