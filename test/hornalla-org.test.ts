import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
/* eslint-disable @typescript-eslint/no-explicit-any */
const Store = require("../web/store.js") as any;
const Org = require("../web/org-lib.js") as any;
const Donante = require("../web/donante-lib.js") as any;
const C = require("../web/canasta-lib.js") as any;

function cargar(archivo: string, global: string) {
  const w: Record<string, unknown> = {};
  (globalThis as Record<string, unknown>).window = w;
  const p = require.resolve(archivo);
  delete require.cache[p];
  require(archivo);
  delete (globalThis as Record<string, unknown>).window;
  return w[global] as any;
}
const canasta = cargar("../web/canasta-data.js", "CANASTA_DATA");
const precios = cargar("../web/precios-data.js", "PRECIOS_DATA");
const CBA = canasta.cba[canasta.periodos.length - 1];

/** Almacenamiento falso en memoria (como localStorage). */
function fakeStorage(inicial: Record<string, string> = {}) {
  const m = { ...inicial };
  return { m, getItem: (k: string) => (k in m ? m[k] : null), setItem: (k: string, v: string) => { m[k] = v; }, removeItem: (k: string) => { delete m[k]; } };
}

describe("Store: almacén local", () => {
  it("arranca con valores por defecto válidos", () => {
    const e = Store.crear(fakeStorage()).leer();
    expect(e.grupo).toEqual({ sel: {}, dias: 30, porcion: 100 });
    expect(e.ingresos).toEqual([]);
  });
  it("guarda y vuelve a leer desde el almacenamiento", () => {
    const st = fakeStorage();
    const a = Store.crear(st);
    a.actualizar((e: any) => { e.org.nombre = "Merendero La Esperanza"; e.ingresos.push({ id: "1", fecha: "2026-11-02", monto: 50000, origen: "Vecinos" }); });
    const b = Store.crear(st).leer();
    expect(b.org.nombre).toBe("Merendero La Esperanza");
    expect(b.ingresos).toHaveLength(1);
  });
  it("sanea datos corruptos o maliciosos sin lanzar", () => {
    const sucio = {
      org: { nombre: "<script>alert(1)</script>".repeat(10), alias: "x".repeat(200), mensaje: 5 },
      grupo: { sel: { a30v: "7", "__proto__": 3, zzz: 9, p3m: -4, e12m: 99999999 }, dias: 99, porcion: -5 },
      ingresos: [{ fecha: "2026-02-31", monto: 100 }, { fecha: "2026-11-01", monto: -5 }, { fecha: "2026-11-01", monto: "abc" }, { fecha: "2026-11-01", monto: 1000, origen: "ok" }],
      gastos: [{ fecha: "2026-11-01", monto: 10, rubro: "robo" }],
      stock: { papa: 5, "../x": 1, leche: "NaN" },
      raciones: { "2026-11-01": 40, "mañana": 5, "2026-11-02": -3 },
    };
    const e = Store.sanear(sucio);
    expect(e.org.nombre.length).toBeLessThanOrEqual(60);
    expect(e.org.alias.length).toBeLessThanOrEqual(40);
    expect(e.grupo.sel).toEqual({ a30v: 7, e12m: 9999 });
    expect(e.grupo.dias).toBe(31);
    expect(e.grupo.porcion).toBe(1);
    expect(e.ingresos).toHaveLength(1);
    expect(e.gastos[0].rubro).toBe("otros");
    expect(e.stock).toEqual({ papa: 5 });
    expect(e.raciones).toEqual({ "2026-11-01": 40 });
    expect(Store.sanear("basura")).toEqual(Store.defaults());
    expect(Store.sanear(null)).toEqual(Store.defaults());
  });
  it("si el almacenamiento falla, sigue funcionando en memoria", () => {
    const roto = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("lleno"); }, removeItem() {} };
    const s = Store.crear(roto);
    s.actualizar((e: any) => { e.org.nombre = "X"; });
    expect(s.leer().org.nombre).toBe("X");
    expect(s.persistente).toBe(false);
    expect(Store.crear(null).leer().org.nombre).toBe("");
  });
  it("exportar e importar es un viaje de ida y vuelta; rechaza archivos ajenos", () => {
    const a = Store.crear(fakeStorage());
    a.actualizar((e: any) => { e.raciones["2026-11-03"] = 55; e.org.nombre = "Olla"; });
    const json = a.exportarJSON();
    const b = Store.crear(fakeStorage());
    expect(b.importarJSON(json).ok).toBe(true);
    expect(b.leer().raciones).toEqual({ "2026-11-03": 55 });
    expect(b.importarJSON("{no es json").ok).toBe(false);
    expect(b.importarJSON(JSON.stringify({ app: "otra", datos: {} })).ok).toBe(false);
  });
  it("borrar deja todo en blanco", () => {
    const st = fakeStorage();
    const s = Store.crear(st);
    s.actualizar((e: any) => { e.org.nombre = "X"; });
    s.borrar();
    expect(Store.crear(st).leer().org.nombre).toBe("");
  });
});

describe("Org: presupuesto del mes", () => {
  const estado = Store.sanear({
    ingresos: [{ fecha: "2026-11-02", monto: 100000, origen: "a" }, { fecha: "2026-11-20", monto: 50000, origen: "b" }, { fecha: "2026-10-30", monto: 999, origen: "viejo" }],
    gastos: [{ fecha: "2026-11-05", monto: 40000, rubro: "alimentos" }, { fecha: "2026-11-06", monto: 10000, rubro: "gas" }, { fecha: "2026-12-01", monto: 5, rubro: "otros" }],
    raciones: { "2026-11-02": 40, "2026-11-03": 60, "2026-12-01": 7 },
  });
  it("suma solo el mes pedido", () => {
    const r = Org.resumenMes(estado, "2026-11", 600000, 30);
    expect(r.ingresos).toBe(150000);
    expect(r.gastos).toBe(50000);
    expect(r.gastosAlimentos).toBe(40000);
    expect(r.saldo).toBe(100000);
  });
  it("cubierto, faltan y días que cubre (dinero ÷ costo diario)", () => {
    const r = Org.resumenMes(estado, "2026-11", 600000, 30);
    expect(r.cubiertoPct).toBeCloseTo(25, 8);
    expect(r.faltan).toBe(450000);
    expect(r.diasCubiertosPorIngresos).toBeCloseTo(7.5, 8);
    expect(r.diasConSaldo).toBeCloseTo(5, 8);
  });
  it("si el costo es 0 no divide por cero", () => {
    const r = Org.resumenMes(estado, "2026-11", 0, 30);
    expect(r.cubiertoPct).toBeNull();
    expect(r.diasCubiertosPorIngresos).toBeNull();
    expect(r.faltan).toBe(0);
  });
  it("un mes sin movimientos da ceros", () => {
    const r = Org.resumenMes(estado, "2027-01", 600000, 30);
    expect(r.ingresos).toBe(0);
    expect(r.saldo).toBe(0);
  });
  it("meses con datos, ordenados", () => {
    expect(Org.mesesConDatos(estado)).toEqual(["2026-10", "2026-11", "2026-12"]);
  });
  it("hoyISO usa la fecha local con ceros", () => {
    expect(Org.hoyISO(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("Org: raciones", () => {
  const estado = Store.sanear({
    gastos: [{ fecha: "2026-11-05", monto: 50000, rubro: "alimentos" }, { fecha: "2026-11-06", monto: 20000, rubro: "gas" }],
    raciones: { "2026-11-02": 40, "2026-11-03": 60 },
  });
  it("total, días, promedio y máximo", () => {
    expect(Org.racionesMes(estado, "2026-11")).toEqual({ total: 100, diasConServicio: 2, promedio: 50, maximo: 60 });
  });
  it("costo por ración usa solo gastos de alimentos", () => {
    expect(Org.costoPorRacion(estado, "2026-11")).toBe(500);
    expect(Org.costoPorRacion(estado, "2026-10")).toBeNull();
  });
  it("plan vs real", () => {
    expect(Org.planVsReal(estado, "2026-11", 10, 20)).toEqual({ plan: 200, real: 100, pct: 50 });
  });
});

describe("Org: inventario, comidas y lista de compras", () => {
  it("migración v1 → v2: el stock viejo pasa a inventario y las bebidas alcohólicas no", () => {
    const e = Store.sanear({ stock: { papa: 5000, leche: 9000, beb_alc: 1080 } });
    expect(e.v).toBe(2);
    const papa = e.inventario.find((i: any) => i.nombre === "Papa");
    expect(papa).toBeTruthy();
    expect(papa.cantidad).toBe(5);
    expect(papa.unidad).toBe("kg");
    const leche = e.inventario.find((i: any) => i.nombre === "Leche");
    expect(leche.unidad).toBe("kg"); // la canasta la expresa en gramos
    expect(e.inventario.some((i: any) => /alc/i.test(i.nombre))).toBe(false);
    expect(e.inventario).toHaveLength(2);
  });
  it("un estado v2 no se re-migra ni pierde su inventario", () => {
    const antes = { inventario: [{ id: "a1", nombre: "Arroz", cantidad: 3, unidad: "kg", vence: "" }], stock: { papa: 5000 } };
    const e = Store.sanear(antes);
    expect(e.inventario).toHaveLength(1);
    expect(e.inventario[0].nombre).toBe("Arroz");
  });

  it("ingresoInventario suma a lo existente aunque la unidad sea g o kg", () => {
    let inv: any[] = [{ id: "a1", nombre: "Arroz", cantidad: 2, unidad: "kg", vence: "" }];
    inv = Org.ingresoInventario(inv, { nombre: "arroz", cantidad: 500, unidad: "g" });
    expect(inv).toHaveLength(1);
    expect(inv[0].cantidad).toBe(2.5);
    inv = Org.ingresoInventario(inv, { nombre: "Fideos", cantidad: 3, unidad: "kg" });
    expect(inv).toHaveLength(2);
  });
  it("consumirInventario descuenta, no baja de cero y elimina lo que queda en cero", () => {
    let inv: any[] = [{ id: "a1", nombre: "Arroz", cantidad: 2, unidad: "kg", vence: "" }];
    inv = Org.consumirInventario(inv, { nombre: "Arroz", cantidad: 1500, unidad: "g" });
    expect(inv[0].cantidad).toBe(0.5);
    inv = Org.consumirInventario(inv, { nombre: "Arroz", cantidad: 900, unidad: "g" });
    expect(inv).toHaveLength(0); // quedó en 0: se quita
    expect(Org.consumirInventario([], { nombre: "X", cantidad: 1, unidad: "kg" })).toHaveLength(0);
  });

  it("las necesidades escalan la receta a las personas cocinadas y suman por ingrediente", () => {
    const recetas = [
      { id: "r1", nombre: "Guiso", personas: 4, ingredientes: [
        { nombre: "Fideos", cantidad: 0.5, unidad: "kg" },
        { nombre: "Cebolla", cantidad: 300, unidad: "g" },
      ] },
      { id: "r2", nombre: "Sopa", personas: 10, ingredientes: [{ nombre: "Cebolla", cantidad: 0.2, unidad: "kg" }] },
    ];
    const comidas = [
      { id: "c1", fecha: "2026-11-03", recetaId: "r1", personas: 8 },   // factor 2 → 1 kg fideos, 600 g cebolla
      { id: "c2", fecha: "2026-11-10", recetaId: "r2", personas: 50 }, // factor 5 → 1 kg cebolla
      { id: "c3", fecha: "2026-12-01", recetaId: "r1", personas: 4 },  // otro mes: no cuenta
    ];
    const n = Org.necesidadesDeComidas(recetas, comidas, "2026-11");
    expect(n.find((x: any) => x.nombre === "Fideos")).toMatchObject({ cantidad: 1, unidad: "kg" });
    const cebolla = n.find((x: any) => x.nombre === "Cebolla");
    expect(cebolla.cantidad).toBeCloseTo(1.6, 6); // 600 g + 1 kg agregados en kg
    expect(Org.necesidadesDeComidas(recetas, comidas, "2026-12")).toHaveLength(2); // guiso para 4: fideos 0,5 kg + cebolla 300 g
  });

  it("la lista de compras resta el inventario (con donaciones anotadas) por medida compatible", () => {
    const necesidades = [
      { nombre: "Fideos", unidad: "kg", cantidad: 10 },
      { nombre: "Cebolla", unidad: "kg", cantidad: 2 },
    ];
    const inventario = [
      { id: "i1", nombre: "fideos", cantidad: 2500, unidad: "g", vence: "" }, // 2,5 kg
      { id: "i2", nombre: "Cebolla", cantidad: 3, unidad: "kg", vence: "" },
    ];
    const c = Org.comprasPendientes(necesidades, inventario);
    expect(c.find((x: any) => x.nombre === "Fideos")).toMatchObject({ necesario: 10, hay: 2.5, falta: 7.5 });
    expect(c.find((x: any) => x.nombre === "Cebolla").falta).toBe(0); // la donación cubre todo
  });

  it("el pedido de compras lista lo que falta, del más urgente primero", () => {
    const pend = [
      { nombre: "Fideos", unidad: "kg", necesario: 10, hay: 2.5, falta: 7.5 },
      { nombre: "Cebolla", unidad: "kg", necesario: 2, hay: 3, falta: 0 },
      { nombre: "Aceite", unidad: "litros", necesario: 3, hay: 0, falta: 3 },
    ];
    const t = Org.pedidoComprasTexto("Merendero X", pend, { max: 2 });
    expect(t).toContain("*Merendero X* necesita comprar:");
    expect(t.split("\n").filter((l: string) => l.startsWith("•"))).toHaveLength(2);
    expect(t.indexOf("Fideos")).toBeLessThan(t.indexOf("Aceite")); // mayor faltante primero
    expect(t).not.toContain("Cebolla");
    expect(t).not.toContain("alimentos más"); // con 2 faltantes y máximo 2, no se corta nada
    expect(Org.pedidoComprasTexto("X", pend.filter((p: any) => p.falta === 0))).toBe("");
  });

  it("costos: gasto monetario y costo económico estimado (con donaciones anotadas con valor)", () => {
    const estado = Store.sanear({
      gastos: [{ fecha: "2026-11-05", monto: 50000, rubro: "alimentos" }],
      raciones: { "2026-11-02": 40, "2026-11-03": 60 },
      movimientos: [
        { fecha: "2026-11-04", tipo: "donacion", itemNombre: "Verduras", cantidad: 20, unidad: "kg", valor: 30000 },
        { fecha: "2026-11-05", tipo: "compra", itemNombre: "Fideos", cantidad: 10, unidad: "kg", valor: null },
      ],
    });
    const rc = Org.resumenCostos(estado, "2026-11");
    expect(rc.gastoAlimentos).toBe(50000);
    expect(rc.valorDonaciones).toBe(30000);
    expect(rc.costoEstimadoTotal).toBe(80000);
    expect(rc.gastoPorRacion).toBe(500);
    expect(rc.costoEconomicoPorRacion).toBe(800);
    const sinDatos = Org.resumenCostos(Store.sanear({}), "2026-11");
    expect(sinDatos.gastoPorRacion).toBeNull();
    expect(sinDatos.costoEconomicoPorRacion).toBeNull();
    expect(sinDatos.valorDonaciones).toBe(0);
  });
});

describe("Org: exportación CSV", () => {
  const estado = Store.sanear({
    ingresos: [{ fecha: "2026-11-02", monto: 1000, origen: 'Vecinos; "los de la esquina"' }],
    gastos: [{ fecha: "2026-11-03", monto: 500, rubro: "gas", detalle: "garrafa" }],
    raciones: { "2026-11-04": 42 },
  });
  it("incluye ingresos, gastos y raciones y escapa ; y comillas", () => {
    const lineas = Org.aCSV(estado, "2026-11").split("\n");
    expect(lineas[0]).toBe("tipo;fecha;monto_o_valor;rubro_u_origen;detalle");
    expect(lineas[1]).toBe('ingreso;2026-11-02;1000;"Vecinos; ""los de la esquina""";');
    expect(lineas[2]).toBe("gasto;2026-11-03;500;Gas y combustible;garrafa");
    expect(lineas[3]).toBe("raciones;2026-11-04;;;42");
  });
  it("filtra por mes", () => {
    expect(Org.aCSV(estado, "2026-12").split("\n")).toHaveLength(1);
    expect(Org.aCSV(estado, null).split("\n")).toHaveLength(4);
  });
  it("incluye los movimientos de despensa con su valor cuando lo tienen", () => {
    const conMovs = Store.sanear({
      movimientos: [
        { fecha: "2026-11-04", tipo: "donacion", itemNombre: "Verduras", cantidad: 20, unidad: "kg", valor: 30000, detalle: "verdulería" },
        { fecha: "2026-11-05", tipo: "consumo", itemNombre: "Fideos", cantidad: 4, unidad: "kg", valor: null },
      ],
    });
    const lineas = Org.aCSV(conMovs, "2026-11").split("\n");
    expect(lineas[1]).toBe("despensa: donación;2026-11-04;30000;Verduras · 20 kg;verdulería");
    expect(lineas[2]).toBe("despensa: consumo;2026-11-05;;Fideos · 4 kg;");
  });
});

describe("Donante: enlace y validación", () => {
  const ctx = { org: "Merendero La Esperanza", alias: "esperanza.merendero", titular: "Asociación Civil La Esperanza", nota: "Meriendas para 60 chicos", sel: { p5m: 10, a30m: 4 }, dias: 20, porcion: 50, recibido: 120000, servidas: 800, fecha: "2026-11-05" };
  it("ida y vuelta serializar → parsear", () => {
    const back = Donante.parsear(Donante.serializar(ctx));
    expect(back).toEqual(ctx);
  });
  it("descarta alias con caracteres raros y fechas imposibles", () => {
    const h = "a=https://estafa.com/pagame&f=2026-02-30&o=X";
    const c = Donante.parsear(h);
    expect(c.alias).toBe("");
    expect(c.fecha).toBe("");
    expect(c.org).toBe("X");
    expect(Donante.parsear("a=ab").alias).toBe(""); // muy corto
    expect(Donante.parsear("a=mi.alias.ok").alias).toBe("mi.alias.ok");
  });
  it("no deja pasar HTML en los textos", () => {
    const c = Donante.parsear("o=" + encodeURIComponent("<img src=x onerror=alert(1)>") + "&n=" + encodeURIComponent("<b>hola</b>"));
    expect(c.org).not.toMatch(/[<>]/);
    expect(c.nota).not.toMatch(/[<>]/);
  });
  it("un enlace vacío o basura da un ctx válido", () => {
    const c = Donante.parsear("%%%&&&g=zzz:9,a30v:abc&d=9999&p=-3");
    expect(c.sel).toEqual({});
    expect(c.dias).toBe(31);
    expect(c.porcion).toBe(1);
    expect(Donante.parsear("")).toMatchObject({ org: "", alias: "", sel: {}, dias: 30, porcion: 100, recibido: 0, servidas: 0 });
  });
});

describe("Donante: impacto de un aporte", () => {
  const ctx = Donante.parsear("o=X&g=a30v:10&d=30&p=100&r=200000");
  it("un servicio = lo que el comedor sirve a una persona en un día", () => {
    const imp = Donante.impacto(23905.82, ctx, CBA, precios);
    // 10 varones adultos, 30 días, 100 %: cada servicio cuesta CBA/30
    expect(imp.servicios).toBeCloseTo(23905.82 / (CBA / 30), 6);
    expect(imp.personas).toBe(10);
  });
  it("coincide con el cálculo de Canasta (días de una niña/niño de 5 años)", () => {
    const imp = Donante.impacto(50000, ctx, CBA, precios);
    expect(imp.perfiles[1].dias).toBeCloseTo(C.diasQueCubre(50000, CBA, 0.6, 100), 10);
  });
  it("qué falta y qué parte cubre este aporte", () => {
    const costo = C.costoMensual(CBA, 10, 30, 100);
    const imp = Donante.impacto(100000, ctx, CBA, precios);
    expect(imp.falta).toBeCloseTo(costo - 200000, 6);
    expect(imp.pctDeLoQueFalta).toBeCloseTo((100000 / (costo - 200000)) * 100, 6);
    expect(imp.cubiertoDespuesPct).toBeCloseTo(((200000 + 100000) / costo) * 100, 6);
  });
  it("si ya está cubierto el mes, no inventa faltante", () => {
    const c2 = Donante.parsear("g=a30v:1&r=99999999");
    const imp = Donante.impacto(1000, c2, CBA, precios);
    expect(imp.falta).toBe(0);
    expect(imp.pctDeLoQueFalta).toBeNull();
    expect(imp.cubiertoDespuesPct).toBe(100);
  });
  it("sin datos del grupo no inventa servicios ni faltante, pero sí perfiles y compras", () => {
    const imp = Donante.impacto(50000, Donante.parsear(""), CBA, precios);
    expect(imp.servicios).toBeNull();
    expect(imp.falta).toBeNull();
    expect(imp.perfiles).toHaveLength(5);
    expect(imp.compras.length).toBe(precios.items.length);
  });
  it("compras = monto ÷ precio promedio del INDEC", () => {
    const imp = Donante.impacto(50000, ctx, CBA, precios);
    const leche = imp.compras.find((x: any) => x.id === "leche");
    const precioLeche = precios.items.find((x: any) => x.id === "leche").precio;
    expect(leche.cantidad).toBeCloseTo(50000 / precioLeche, 10);
    expect(leche.unidad).toBe("litros");
  });
  it("nombres de unidad de los precios", () => {
    expect(Donante.unidadPrecio("kg", 5)).toBe("kg");
    expect(Donante.unidadPrecio("Docena", 1)).toBe("docena");
    expect(Donante.unidadPrecio("500 g", 8)).toBe("paquetes de 500 g");
    expect(Donante.unidadPrecio("Bot. 1,5 litros", 3)).toBe("botellas de 1,5 litros");
  });
  it("aportes sugeridos: redondeados hacia arriba a $500, así la cuenta siempre alcanza", () => {
    const p = Donante.presets(CBA, 100);
    for (const x of p.conSentido) expect(x.monto % 500).toBe(0);
    const semana = p.conSentido.find((x: any) => x.id === "semana");
    const dias = C.diasQueCubre(semana.monto, CBA, 0.6, 100);
    expect(dias).toBeGreaterThanOrEqual(7);
    expect(dias).toBeLessThan(7.2);
    expect(p.fijos).toEqual([5000, 10000, 25000, 50000]);
  });
  it("los textos para compartir usan solo números calculados y no prometen de más", () => {
    const imp = Donante.impacto(50000, ctx, CBA, precios);
    const t = Donante.textoDonante(ctx, 50000, imp, "https://ejemplo.org/d");
    expect(t).toContain("Hoy aporté $ 50.000 a *X*");
    expect(t).toContain("servicios de comida");
    expect(t).toContain("https://ejemplo.org/d");
    expect(Donante.textoInvitar(ctx, "https://ejemplo.org/d")).toContain("datos oficiales del INDEC");
    expect(Donante.fechaLarga("2026-11-05")).toBe("5 de noviembre de 2026");
    expect(Donante.fechaLarga("mal")).toBe("");
  });
});

describe("Datos de referencia", () => {
  it("precios: 15 alimentos, todos con precio positivo y del mismo período", () => {
    expect(precios.items).toHaveLength(15);
    for (const i of precios.items) expect(i.precio).toBeGreaterThan(0);
    expect(precios.periodo).toMatch(/^\d{6}$/);
    expect(precios.region).toBe("GBA");
  });
});
