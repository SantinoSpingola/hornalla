// Compara los datos recién generados con los anteriores y evita commits que solo cambian la fecha `generado`.
//
//   node scripts/datos-cambiaron.mjs --prev <carpeta-con-los-archivos-anteriores>
//
// Si un archivo no cambió de verdad, lo restaura desde <carpeta>. Si alguno cambió, escribe
// `cambiado=true` en $GITHUB_OUTPUT (cuando corre en GitHub Actions).
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const i = process.argv.indexOf("--prev");
const previa = i >= 0 ? process.argv[i + 1] : "";
if (!previa) {
  console.error("Falta --prev <carpeta>");
  process.exit(1);
}

const archivos = [
  ["canasta-data.js", "CANASTA_DATA"],
  ["precios-data.js", "PRECIOS_DATA"],
];

function leer(ruta) {
  const texto = readFileSync(ruta, "utf8");
  const inicio = texto.indexOf("=");
  return JSON.parse(texto.slice(inicio + 1).trim().replace(/;$/, ""));
}

/** Lo que importa: todo menos la marca de generación. */
function contenido(datos) {
  const { generado, ...resto } = datos;
  return JSON.stringify(resto);
}

let cambiado = false;
for (const [archivo, global] of archivos) {
  const actual = join(root, "web", archivo);
  const anterior = join(previa, archivo);
  let igual = false;
  try {
    igual = contenido(leer(actual)) === contenido(leer(anterior));
  } catch {
    igual = false;
  }
  if (igual) {
    copyFileSync(anterior, actual); // solo cambió `generado`: no vale un commit
    console.log(`= ${archivo}: sin cambios reales.`);
  } else {
    cambiado = true;
    console.log(`* ${archivo}: hay datos nuevos.`);
  }
}

if (process.env.GITHUB_OUTPUT) {
  const fs = await import("node:fs");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `cambiado=${cambiado}\n`);
}
console.log(cambiado ? "\nHay datos nuevos para publicar." : "\nNo hay datos nuevos.");
