// Revisa si los datos publicados están al día. No modifica nada.
//
//   node scripts/estado-datos.mjs             → informe y código 0
//   node scripts/estado-datos.mjs --estricto  → código 1 si falta el período esperado
//
// El INDEC publica la canasta junto con el IPC, a mediados de mes. Por eso:
//  - antes del día 15, el último dato esperado es el de hace dos meses;
//  - desde el día 15, el último dato esperado es el del mes anterior.
// Si el período esperado no está, el script lo dice y (con --estricto) falla.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function leerDatos(archivo, global) {
  const texto = readFileSync(join(root, "web", archivo), "utf8");
  const inicio = texto.indexOf("=");
  return JSON.parse(texto.slice(inicio + 1).trim().replace(/;$/, ""));
}

const canasta = leerDatos("canasta-data.js", "CANASTA_DATA");
const precios = leerDatos("precios-data.js", "PRECIOS_DATA");

const hoy = new Date();
const periodo = (fecha) => `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, "0")}`;
const esperado = new Date(hoy.getFullYear(), hoy.getMonth() - (hoy.getDate() >= 15 ? 1 : 2), 1);
const esperadoPeriodo = periodo(esperado);

const meses = (a, b) => {
  const [ay, am] = [Number(a.slice(0, 4)), Number(a.slice(4, 6))];
  const [by, bm] = [Number(b.slice(0, 4)), Number(b.slice(4, 6))];
  return (by - ay) * 12 + (bm - am);
};
const atraso = meses(canasta.ultimoPeriodo, esperadoPeriodo);
const diasGenerado = Math.floor((Date.now() - new Date(canasta.generado).getTime()) / 86_400_000);

console.log(`Hoy: ${hoy.toISOString().slice(0, 10)}`);
console.log(`Canasta: último período ${canasta.ultimoPeriodo} (${canasta.region}), generado hace ${diasGenerado} días.`);
console.log(`Precios: último período ${precios.periodo}.`);
console.log(`Esperado para esta altura del mes: ${esperadoPeriodo}.`);

let problema = "";
if (atraso > 0) problema = `Falta el período ${esperadoPeriodo}: los datos están ${atraso} mes(es) atrás.`;
else if (diasGenerado > 45) problema = `Los datos tienen ${diasGenerado} días sin regenerarse (¿token vencido?).`;

if (problema) {
  console.error(`\n⚠ ${problema}`);
  if (process.argv.includes("--estricto")) process.exit(1);
} else {
  console.log("\n✓ Los datos están al día.");
}
