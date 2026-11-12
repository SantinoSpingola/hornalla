// Genera web/precios-data.js: precios promedio de alimentos básicos (GBA, último mes con dato de TODOS)
// para mostrar a quien dona qué se puede comprar con su aporte. Fuente: API oficial del INDEC (IPC · Precio promedio).
// Uso: node scripts/build-precios-data.mjs        (requiere INDEC_API_TOKEN)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IndecClient } from "indec-mcp/dist/client/client.js"; // cliente del paquete indec-mcp (npm)

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const client = new IndecClient({ cacheTtlMs: 0 });
if (!client.hasToken) throw new Error("Falta INDEC_API_TOKEN");

// Alimentos que figuran en la canasta básica y tienen precio promedio directo en el INDEC.
const ITEMS = [
  { id: "pan", descripcion: "Pan francés", etq: "Pan" },
  { id: "papa", descripcion: "Papa", etq: "Papa" },
  { id: "arroz", descripcion: "Arroz blanco simple", etq: "Arroz" },
  { id: "fideos", descripcion: "Fideos secos tipo guisero", etq: "Fideos" },
  { id: "harina", descripcion: "Harina de trigo común", etq: "Harina" },
  { id: "azucar", descripcion: "Azúcar", etq: "Azúcar" },
  { id: "aceite", descripcion: "Aceite de girasol", etq: "Aceite" },
  { id: "leche", descripcion: "Leche fresca entera sachet", etq: "Leche" },
  { id: "huevos", descripcion: "Huevos de gallina", etq: "Huevos" },
  { id: "carne", descripcion: "Carne picada común", etq: "Carne picada" },
  { id: "pollo", descripcion: "Pollo entero", etq: "Pollo" },
  { id: "cebolla", descripcion: "Cebolla", etq: "Cebolla" },
  { id: "banana", descripcion: "Banana", etq: "Banana" },
  { id: "manzana", descripcion: "Manzana deliciosa", etq: "Manzana" },
  { id: "yerba", descripcion: "Yerba mate", etq: "Yerba" },
];

const { rows } = await client.queryAll(
  {
    dataset: "ipc_nacional",
    select: ["descripcion", "periodo", "valor", "tipo_de_indicador_descripcion"],
    filters: [
      { column: "tipo_de_indicador", op: "eq", value: "Precio promedio" },
      { column: "region", op: "eq", value: "GBA" },
      { column: "descripcion", op: "in", value: ITEMS.map((i) => i.descripcion) },
      { column: "periodo", op: "gte", value: "202601" },
    ],
  },
  5000,
);
console.log(`Filas de precios: ${rows.length}`);

// Último período en el que TODOS los alimentos tienen precio (así nunca se mezclan meses).
const porPeriodo = new Map();
for (const r of rows) {
  if (typeof r.valor !== "number") continue;
  (porPeriodo.get(String(r.periodo)) ?? porPeriodo.set(String(r.periodo), new Map()).get(String(r.periodo))).set(r.descripcion, r);
}
const completos = [...porPeriodo.entries()].filter(([, m]) => ITEMS.every((i) => m.has(i.descripcion))).map(([p]) => p).sort();
if (!completos.length) throw new Error("Ningún período tiene precio de todos los alimentos");
const periodo = completos.at(-1);
const m = porPeriodo.get(periodo);

const items = ITEMS.map((i) => {
  const r = m.get(i.descripcion);
  const unidad = String(r.tipo_de_indicador_descripcion ?? "").replace(/^Valor por\s*/i, "").trim();
  return { id: i.id, etq: i.etq, nombre: i.descripcion, unidad, precio: Math.round(r.valor * 100) / 100 };
});
for (const i of items) console.log(`${i.etq.padEnd(14)} ${String(i.precio).padStart(9)}  (${i.unidad})`);

const data = {
  generado: new Date().toISOString(),
  periodo,
  region: "GBA",
  items,
  fuente: "INDEC · Catálogo API-INDEC (api.indec.gob.ar) · IPC · Precio promedio · Gran Buenos Aires",
};
writeFileSync(join(root, "web", "precios-data.js"), `// GENERADO por scripts/build-precios-data.mjs — no editar a mano.\nwindow.PRECIOS_DATA = ${JSON.stringify(data)};\n`);
console.log(`\nPeríodo ${periodo}: ${items.length} alimentos → web/precios-data.js`);
