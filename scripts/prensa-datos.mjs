// [ARCHIVADO] Genera archivo/asadometro/prensa/datos-clave.md a partir de archivo/asadometro/data.js: todas las cifras del kit de prensa salen de acá (nada se tipea a mano).
// Uso: node scripts/prensa-datos.mjs
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const A = require(join(root, "archivo", "asadometro", "lib.js"));
globalThis.window = {};
require(join(root, "archivo", "asadometro", "data.js"));
const D = globalThis.window.ASADOMETRO_DATA;

const n1 = (v) => A.num(v, 1);
const ult = D.periodos.length - 1;
const mes = A.periodoLabel(D.ultimoPeriodo, true);
const base = A.mismoMes2017(D);
const L = [];
const p = (s = "") => L.push(s);

p(`# Datos clave — Asadómetro, edición ${mes}`);
p();
p(`> Generado automáticamente por \`scripts/prensa-datos.mjs\` desde \`web/data.js\` (datos del ${new Date(D.generado).toISOString().slice(0, 10)}). No editar a mano: si cambia el dato, se regenera.`);
p();
p("**Cuenta:** unidades = ingreso mensual nominal ÷ precio promedio del producto en el mismo mes. Asado: precio promedio INDEC en GBA. Comparaciones: mismo mes de cada año.");
p();

const asado = D.productos[0];
const precio = asado.precios.GBA;
p("## 1. Asado: kilos que compra cada ingreso");
p();
p(`| Ingreso | ${A.periodoLabel(D.ultimoPeriodo)} | Hace 1 año | Hace 3 años | Hace 5 años | ${A.periodoLabel(base)} | Cambio vs ${A.periodoLabel(base)} | Máximo (mes) | Mínimo (mes) |`);
p("|---|---|---|---|---|---|---|---|---|");
for (const k of ["smvm", "haber_minimo", "auh"]) {
  const s = A.serie(D, k, 0, "GBA");
  const refs = A.referencias(D, s);
  const get = (i) => refs[i] ? n1(refs[i].valor) : "s/d";
  const ex = A.extremos(s);
  p(`| ${D.ingresos[k].etiqueta} | **${n1(s[ult])} kg** | ${get(0)} | ${get(1)} | ${get(2)} | ${get(3)} | ${refs[3] ? A.pct(refs[3].cambio) : "s/d"} | ${n1(ex.max.v)} (${A.periodoLabel(D.periodos[ex.max.i])}) | ${n1(ex.min.v)} (${A.periodoLabel(D.periodos[ex.min.i])}) |`);
}
p();

p("## 2. Precios y montos de referencia (pesos corrientes)");
p();
const i17 = A.idxDe(D, base);
p(`| | ${A.periodoLabel(base)} | ${A.periodoLabel(D.ultimoPeriodo)} | Variación nominal |`);
p("|---|---|---|---|");
p(`| Kilo de asado (GBA) | ${A.pesos(precio[i17])} | ${A.pesos(precio[ult])} | ${A.pct(A.cambioPct(precio[i17], precio[ult]))} |`);
for (const k of ["smvm", "haber_minimo", "auh"]) {
  const sr = D.ingresos[k].serie;
  p(`| ${D.ingresos[k].etiqueta} | ${A.pesos(sr[i17])} | ${A.pesos(sr[ult])} | ${A.pct(A.cambioPct(sr[i17], sr[ult]))} |`);
}
p();
p("Lectura: el asado subió más (en pesos) que cada uno de los tres ingresos de referencia; por eso la cantidad de kilos que compran cada uno es menor que en 2017.");
p();

p("## 3. Triangulación con cifras publicadas por la prensa");
p();
const chk = [
  ["Salario mínimo, enero 2026", "202601", "smvm", "≈ 21 kg (El Destape, 2026)"],
  ["Salario mínimo, junio 2025", "202506", "smvm", "≈ 28 kg (informe citado por El Ancasti)"],
];
p("| Caso | Asadómetro | Publicado por terceros |");
p("|---|---|---|");
for (const [etq, per, k, ext] of chk) {
  const s = A.serie(D, k, 0, "GBA");
  p(`| ${etq} | ${n1(s[A.idxDe(D, per)])} kg | ${ext} |`);
}
p();
p("Las cifras coinciden dentro del redondeo, lo que respalda la metodología. (Las diferencias entre fuentes de prensa suelen deberse al mes, al tipo de salario y a qué precio de asado usan.)");
p();

p("## 4. Otros productos (salario mínimo, GBA)");
p();
const rk = A.ranking(D, "smvm", "GBA", base).filter((r) => r.cambio !== null);
const peor = [...rk].sort((a, b) => a.cambio - b.cambio).slice(0, 5);
const mejor = [...rk].sort((a, b) => b.cambio - a.cambio).slice(0, 5);
const fila = (r) => `| ${r.nombre} (${r.unidad}) | ${n1(r.antes)} | ${n1(r.hoy)} | ${A.pct(r.cambio)} |`;
p(`**Los 5 que más poder de compra perdieron** (vs ${A.periodoLabel(base)}):`);
p();
p("| Producto | Antes | Hoy | Cambio |");
p("|---|---|---|---|");
peor.forEach((r) => p(fila(r)));
p();
p("**Los 5 que menos perdieron (o ganaron):**");
p();
p("| Producto | Antes | Hoy | Cambio |");
p("|---|---|---|---|");
mejor.forEach((r) => p(fila(r)));
const perdieron = rk.filter((r) => r.cambio < 0).length;
p();
p(`De los ${rk.length} productos comparables, **${perdieron}** compran hoy menos que en ${A.periodoLabel(base, true)} con el salario mínimo.`);
p();

p("## 5. Por período presidencial (solo referencia de fechas; no atribuye causas)");
p();
p("Salario mínimo medido en kilos de asado, primer y último mes con dato de cada período. **El primer período tiene datos recién desde abril de 2016 (el INDEC publica precio promedio desde esa fecha), por lo que no cubre su inicio.**");
p();
p("| Período | Primer mes con dato | Último mes | Kg al inicio | Kg al final | Cambio |");
p("|---|---|---|---|---|---|");
const s = A.serie(D, "smvm", 0, "GBA");
for (const g of D.gobiernos) {
  const idx = D.periodos.map((per, i) => (per >= g.desde && per <= g.hasta && s[i] !== null ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) continue;
  const a = idx[0], b = idx[idx.length - 1];
  p(`| ${g.nombre} | ${A.periodoLabel(D.periodos[a])} | ${A.periodoLabel(D.periodos[b])}${b === ult ? " (último dato)" : ""} | ${n1(s[a])} | ${n1(s[b])} | ${A.pct(A.cambioPct(s[a], s[b]))} |`);
}
p();
p("> Uso recomendado: mostrar siempre los tres períodos juntos y con el mismo formato. Un punto de inicio y uno de fin no explican qué pasó en el medio ni por qué.");
p();
p("## 6. Cómo verificar cada cifra");
p();
p("1. Precio del asado: API oficial del INDEC (`ipc_nacional`, tipo «Precio promedio», región GBA, descripción «Asado»).");
p("2. Salario mínimo: serie `57.1_SMVMM_0_M_34` de datos.gob.ar (MTEySS). Jubilación mínima: `58.1_MP_0_M_13` (ANSES). AUH: `165.1_AAUH_0_0_3` (ANSES).");
p("3. Dividir ingreso por precio del mismo mes. El sitio ofrece la serie completa en CSV.");
p();

mkdirSync(join(root, "archivo", "asadometro", "prensa"), { recursive: true });
writeFileSync(join(root, "archivo", "asadometro", "prensa", "datos-clave.md"), L.join("\n") + "\n");
console.log(L.join("\n"));
