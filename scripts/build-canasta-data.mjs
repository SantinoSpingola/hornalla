// Genera web/canasta-data.js (Hornalla): CBA/CBT por adulto equivalente desde abr-2016 + hogares de control.
// Fuente: API oficial del INDEC (valorizacion_canastas_cba_cbt, GBA). Requiere INDEC_API_TOKEN.
// Uso: node scripts/build-canasta-data.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IndecClient } from "indec-mcp/dist/client/client.js"; // cliente del paquete indec-mcp (npm)

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const client = new IndecClient({ cacheTtlMs: 0 });
if (!client.hasToken) throw new Error("Falta INDEC_API_TOKEN");

const { rows } = await client.queryAll(
  { dataset: "valorizacion_canastas_cba_cbt", select: ["periodo", "nivel", "codigo", "tipo_de_indicador", "valor", "region"] },
  20_000,
);
console.log(`Canastas: ${rows.length} filas`);
const regiones = [...new Set(rows.map((r) => r.region))];
if (regiones.length !== 1 || regiones[0] !== "GBA") console.warn("¡Atención! Regiones inesperadas:", regiones);

const periodos = [...new Set(rows.map((r) => String(r.periodo)))].sort();
const idx = new Map(periodos.map((p, i) => [p, i]));
const blank = () => Array(periodos.length).fill(null);
const cba = blank(), cbt = blank(), cbaVM = blank(), cbaVIA = blank(), ice = blank();
const hogares = {}; // sólo último período con dato

for (const r of rows) {
  if (typeof r.valor !== "number") continue;
  const i = idx.get(String(r.periodo));
  if (r.nivel === "Adulto equivalente") {
    if (r.codigo === "CBA" && r.tipo_de_indicador === "CBA") cba[i] = r.valor;
    else if (r.codigo === "CBT" && r.tipo_de_indicador === "CBT") cbt[i] = r.valor;
    else if (r.codigo === "CBA" && r.tipo_de_indicador === "v_m") cbaVM[i] = r.valor;
    else if (r.codigo === "CBA" && r.tipo_de_indicador === "v_ia") cbaVIA[i] = r.valor;
    else if (r.codigo === "ICE") ice[i] = r.valor;
  }
}
let last = cba.length - 1;
while (last >= 0 && cba[last] === null) last--;
const ultimoPeriodo = periodos[last];
for (const r of rows) {
  if (String(r.periodo) !== ultimoPeriodo || r.nivel !== "Hogar" || typeof r.valor !== "number") continue;
  const m = /^(CBA|CBT) (H\d)$/.exec(r.codigo);
  if (m) (hogares[m[2]] ??= {})[m[1].toLowerCase()] = r.valor;
}

// Control: CBA × adultos equivalentes oficiales reproduce los hogares publicados.
const AE = { H1: 2.46, H2: 3.09, H3: 3.25 };
for (const [h, ae] of Object.entries(AE)) {
  const esperado = cba[last] * ae, publicado = hogares[h]?.cba;
  const ok = publicado !== undefined && Math.abs(esperado - publicado) < 1;
  console.log(`${h}: CBA×${ae} = ${esperado.toFixed(2)} | INDEC ${publicado} → ${ok ? "OK" : "¡NO COINCIDE!"}`);
  if (!ok) throw new Error(`El control de ${h} no coincide; revisar tablas.`);
}

const cut = last + 1;
const data = {
  generado: new Date().toISOString(),
  ultimoPeriodo,
  region: "GBA",
  periodos: periodos.slice(0, cut),
  cba: cba.slice(0, cut),
  cbt: cbt.slice(0, cut),
  cbaVM: cbaVM.slice(0, cut),
  cbaVIA: cbaVIA.slice(0, cut),
  ice: ice.slice(0, cut),
  hogares,
  fuente: "INDEC · Catálogo API-INDEC (api.indec.gob.ar) · Valorización de las canastas básicas (CBA y CBT) · Gran Buenos Aires",
};
writeFileSync(join(root, "web", "canasta-data.js"), `// GENERADO por scripts/build-canasta-data.mjs — no editar a mano.\nwindow.CANASTA_DATA = ${JSON.stringify(data)};\n`);
console.log(`Último período ${ultimoPeriodo}: CBA AE $${cba[last]} | CBT AE $${cbt[last]} | CBA v.ia ${cbaVIA[last]}% | escrito web/canasta-data.js`);
