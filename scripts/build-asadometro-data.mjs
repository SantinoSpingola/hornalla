// [ARCHIVADO] Genera archivo/asadometro/data.js para el Asadómetro (proyecto en pausa).
//   Precios: API oficial del INDEC (IPC → "Precio promedio", 59 productos × regiones, desde abr-2016). Requiere INDEC_API_TOKEN.
//   Ingresos: API de Series de Tiempo de datos.gob.ar (sin clave): SMVM (MTEySS), haber mínimo y AUH (ANSES).
// Uso: node scripts/build-asadometro-data.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IndecClient } from "indec-mcp/dist/client/client.js"; // cliente del paquete indec-mcp (npm)

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "archivo", "asadometro", "data.js");

const client = new IndecClient({ cacheTtlMs: 0 });
if (!client.hasToken) throw new Error("Falta INDEC_API_TOKEN");

// ── Precios ───────────────────────────────────────────────────────────────
const { rows, total } = await client.queryAll(
  {
    dataset: "ipc_nacional",
    select: ["descripcion", "region", "periodo", "valor", "tipo_de_indicador_descripcion", "unidad_de_medida"],
    filters: [{ column: "tipo_de_indicador", op: "eq", value: "Precio promedio" }],
  },
  50_000,
);
console.log(`Precios promedio: ${rows.length} filas (total API ${total})`);

const periodos = [...new Set(rows.map((r) => String(r.periodo)))].sort();
const pIndex = new Map(periodos.map((p, i) => [p, i]));
const regiones = [...new Set(rows.map((r) => String(r.region)))].sort();

/** @type {Map<string, {nombre:string, unidad:string, precios: Record<string,(number|null)[]>}>} */
const prods = new Map();
const unidades = new Map();
for (const r of rows) {
  if (typeof r.valor !== "number") continue;
  const nombre = String(r.descripcion);
  const unidad = String(r.tipo_de_indicador_descripcion ?? "").replace(/^Valor por\s*/i, "").trim();
  let p = prods.get(nombre);
  if (!p) prods.set(nombre, (p = { nombre, unidad, precios: {} }));
  unidades.set(nombre, unidad);
  const reg = String(r.region);
  const arr = (p.precios[reg] ??= Array(periodos.length).fill(null));
  arr[pIndex.get(String(r.periodo))] = Math.round(r.valor * 100) / 100;
}

// Último período con precio del asado en GBA (el "hoy" del sitio).
const asado = prods.get("Asado");
if (!asado?.precios.GBA) throw new Error("No hay precio del asado en GBA");
let ultimo = periodos.length - 1;
while (ultimo >= 0 && asado.precios.GBA[ultimo] == null) ultimo--;
const ultimoPeriodo = periodos[ultimo];
console.log(`Productos: ${prods.size} | regiones: ${regiones.join(", ")} | períodos ${periodos[0]}–${periodos.at(-1)} | último con asado GBA: ${ultimoPeriodo}`);
console.log("Unidades (muestra):", [...unidades.entries()].slice(0, 8).map(([n, u]) => `${n}=${u}`).join(" | "));

// Recorta lo posterior al último período con asado.
const recorte = ultimo + 1;
const periodosOk = periodos.slice(0, recorte);
for (const p of prods.values()) for (const reg of Object.keys(p.precios)) p.precios[reg] = p.precios[reg].slice(0, recorte);

// ── Ingresos de referencia ────────────────────────────────────────────────
const SERIES = {
  smvm: { id: "57.1_SMVMM_0_M_34", etiqueta: "Salario mínimo", fuente: "MTEySS · Consejo del Salario (vía datos.gob.ar)" },
  haber_minimo: { id: "58.1_MP_0_M_13", etiqueta: "Jubilación mínima", fuente: "ANSES (vía datos.gob.ar)" },
  auh: { id: "165.1_AAUH_0_0_3", etiqueta: "Asignación Universal por Hijo", fuente: "ANSES (vía datos.gob.ar)" },
};
async function serie(id) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(`https://apis.datos.gob.ar/series/api/series/?ids=${id}&format=json&limit=1000&start_date=2016-01`, { signal: AbortSignal.timeout(30_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).data;
    } catch (e) {
      if (i === 3) throw new Error(`Serie ${id}: ${e.message}`);
      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }
}
const ingresos = {};
for (const [k, s] of Object.entries(SERIES)) {
  const data = await serie(s.id);
  const m = new Map(data.map(([d, v]) => [d.slice(0, 4) + d.slice(5, 7), v]));
  ingresos[k] = { etiqueta: s.etiqueta, fuente: s.fuente, serie: periodosOk.map((p) => (typeof m.get(p) === "number" ? Math.round(m.get(p) * 100) / 100 : null)) };
  const ult = ingresos[k].serie.at(-1);
  console.log(`${s.etiqueta}: último ${ultimoPeriodo} = ${ult}`);
  if (ult == null) throw new Error(`${s.etiqueta} sin dato en ${ultimoPeriodo}`);
}

// ── Control de coherencia ─────────────────────────────────────────────────
const kg = (k, i) => ingresos[k].serie[i] / asado.precios.GBA[i];
console.log(`Control: SMVM ${ultimoPeriodo} → ${kg("smvm", ultimo).toFixed(1)} kg | mínima → ${kg("haber_minimo", ultimo).toFixed(1)} kg | AUH → ${kg("auh", ultimo).toFixed(1)} kg`);

const productos = [...prods.values()]
  .sort((a, b) => (a.nombre === "Asado" ? -1 : b.nombre === "Asado" ? 1 : a.nombre.localeCompare(b.nombre, "es")))
  .map((p, i) => ({ id: i, ...p }));

const data = {
  generado: new Date().toISOString(),
  ultimoPeriodo,
  periodos: periodosOk,
  regiones,
  productos,
  ingresos,
  gobiernos: [
    { nombre: "Macri", desde: "201512", hasta: "201911" },
    { nombre: "A. Fernández", desde: "201912", hasta: "202311" },
    { nombre: "Milei", desde: "202312", hasta: "999912" },
  ],
  fuentePrecios: "INDEC · Catálogo API-INDEC (api.indec.gob.ar) · IPC · Precio promedio",
};

writeFileSync(outPath, `// GENERADO por scripts/build-asadometro-data.mjs — no editar a mano.\nwindow.ASADOMETRO_DATA = ${JSON.stringify(data)};\n`);
console.log(`Escrito ${outPath} (${Math.round(JSON.stringify(data).length / 1024)} KB)`);
