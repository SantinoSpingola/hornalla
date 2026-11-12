import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const A = require("../archivo/asadometro/lib.js") as any;

function loadData() {
  const w: Record<string, unknown> = {};
  // data.js asigna a window.ASADOMETRO_DATA
  (globalThis as Record<string, unknown>).window = w;
  delete require.cache[require.resolve("../archivo/asadometro/data.js")];
  require("../archivo/asadometro/data.js");
  delete (globalThis as Record<string, unknown>).window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return w.ASADOMETRO_DATA as any;
}

const data = loadData();

describe("[archivado] Asadómetro: formato", () => {
  it("periodos, números y porcentajes en es-AR", () => {
    expect(A.periodoLabel("202609")).toBe("sep 2026");
    expect(A.periodoLabel("201701", true)).toBe("enero de 2017");
    expect(A.num(1234.5, 1)).toBe("1.234,5");
    expect(A.pesos(383800)).toBe("$ 383.800");
    expect(A.pct(-68.2)).toBe("−68 %");
    expect(A.pct(12.4)).toBe("+12 %");
    expect(A.pct(0.2)).toBe("0 %");
    expect(A.num(null, 1)).toBe("s/d");
  });
  it("nombres de presentación", () => {
    expect(A.unidadLabel("kg", 20)).toBe("kg");
    expect(A.unidadLabel("Litro", 3)).toBe("litros");
    expect(A.unidadLabel("Docena", 1)).toBe("docena");
    expect(A.unidadLabel("500 g", 12)).toBe("unidades de 500 g");
    expect(A.unidadLabel("Bot. 1,5 litros", 55)).toBe("botellas de 1,5 litros");
    expect(A.unidadLabel("Lata 220 g", 1)).toBe("lata de 220 g");
    expect(A.unidadLabel("Env. 4 u", 9)).toBe("envases de 4 u");
  });
});

describe("integridad de los datos generados", () => {
  it("períodos ordenados, sin duplicados y terminan en el último período con asado", () => {
    const p: string[] = data.periodos;
    expect([...p].sort()).toEqual(p);
    expect(new Set(p).size).toBe(p.length);
    expect(p.at(-1)).toBe(data.ultimoPeriodo);
    expect(p[0]).toBe("201604");
  });
  it("hay 59 productos, el asado es el primero y existe en GBA hasta el último período", () => {
    expect(data.productos).toHaveLength(59);
    expect(data.productos[0].nombre).toBe("Asado");
    expect(data.productos[0].precios.GBA.at(-1)).toBeGreaterThan(0);
  });
  it("todas las series tienen el mismo largo que los períodos", () => {
    for (const p of data.productos) for (const r of Object.keys(p.precios)) expect(p.precios[r]).toHaveLength(data.periodos.length);
    for (const k of Object.keys(data.ingresos)) expect(data.ingresos[k].serie).toHaveLength(data.periodos.length);
  });
  it("no contiene datos posteriores al último período ni precios no positivos", () => {
    for (const p of data.productos) for (const r of Object.keys(p.precios)) for (const v of p.precios[r]) if (v !== null) expect(v).toBeGreaterThan(0);
  });
  it("cada ingreso de referencia tiene dato en el último período", () => {
    for (const k of Object.keys(data.ingresos)) expect(data.ingresos[k].serie.at(-1)).toBeGreaterThan(0);
  });
});

describe("cálculo", () => {
  const ult = data.periodos.length - 1;

  it("unidades = ingreso ÷ precio del mismo mes", () => {
    const s = A.serie(data, "smvm", 0, "GBA");
    expect(s[ult]).toBeCloseTo(data.ingresos.smvm.serie[ult] / data.productos[0].precios.GBA[ult], 10);
  });

  it("coincide con la comparación publicada por la prensa (salario mínimo, enero 2026 ≈ 21 kg de asado)", () => {
    // El Destape (2026): "actualizada a enero de 2026 permite comprar 21 kilos".
    const i = A.idxDe(data, "202601");
    const kg = A.serie(data, "smvm", 0, "GBA")[i];
    expect(kg).toBeGreaterThan(20.5);
    expect(kg).toBeLessThan(22);
  });

  it("monto fijo: monto ÷ precio", () => {
    const s = A.serie(data, 500000, 0, "GBA");
    expect(s[ult]).toBeCloseTo(500000 / data.productos[0].precios.GBA[ult], 10);
  });

  it("producto sin esa región da todo null (no inventa datos)", () => {
    const s = A.serie(data, "smvm", 0, "Cuyo");
    expect(s.every((v: unknown) => v === null)).toBe(true);
  });

  it("referencias: orden y variaciones coherentes", () => {
    const arr = A.serie(data, "smvm", 0, "GBA");
    const refs = A.referencias(data, arr);
    const mes = A.mismoMes2017(data); // mismo mes, 2017
    expect(mes).toBe("2017" + data.ultimoPeriodo.slice(4));
    expect(refs.map((r: { periodo: string }) => r.periodo)).toEqual([data.periodos[ult - 12], data.periodos[ult - 36], data.periodos[ult - 60], mes]);
    expect(refs[0].etiqueta).toBe("Hace 1 año");
    expect(refs[3].etiqueta).toMatch(/de 2017$/);
    expect(refs[3].cambio).toBeCloseTo((arr[ult] / arr[A.idxDe(data, mes)] - 1) * 100, 8);
    expect(refs[3].cambio).toBeLessThan(0); // hoy compra menos que en 2017
  });

  it("extremos: mínimo y máximo son realmente extremos", () => {
    const arr = A.serie(data, "haber_minimo", 0, "GBA");
    const { min, max } = A.extremos(arr);
    for (const v of arr) if (v !== null) { expect(v).toBeGreaterThanOrEqual(min.v); expect(v).toBeLessThanOrEqual(max.v); }
  });

  it("ranking: ordena con cambio calculado y respeta la región", () => {
    const r = A.ranking(data, "smvm", "GBA", "201701");
    expect(r.length).toBeGreaterThan(40);
    for (const row of r) if (row.antes !== null) expect(row.cambio).toBeCloseTo((row.hoy / row.antes - 1) * 100, 8);
    const sinCuyo = A.ranking(data, "smvm", "Cuyo", "201701");
    expect(sinCuyo.length).toBeLessThan(r.length);
  });

  it("ranking por defecto compara contra el mismo mes de 2017 (evita sesgo de temporada)", () => {
    const base = A.mismoMes2017(data);
    const r = A.ranking(data, "smvm", "GBA");
    const tomate = r.find((x: { nombre: string }) => x.nombre === "Tomate redondo");
    const pr = data.productos.find((p: { nombre: string }) => p.nombre === "Tomate redondo").precios.GBA;
    expect(tomate.antes).toBeCloseTo(data.ingresos.smvm.serie[A.idxDe(data, base)] / pr[A.idxDe(data, base)], 8);
  });

  it("ranking con monto fijo no inventa cambio histórico", () => {
    const r = A.ranking(data, 600000, "GBA", "201701");
    expect(r.every((x: { cambio: unknown }) => x.cambio === null)).toBe(true);
  });

  it("CSV: encabezado, una fila por mes con precio, y valores consistentes", () => {
    const csv = A.aCSV(data, "auh", 0, "GBA").split("\n");
    expect(csv[0]).toContain("unidades_compradas");
    expect(csv.length).toBe(1 + data.productos[0].precios.GBA.filter((v: unknown) => v !== null).length);
    expect(csv.at(-1)).toContain(data.ultimoPeriodo);
  });
});
