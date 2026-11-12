// Cambia el nombre de la herramienta en todo el sitio y los documentos, de una sola vez.
//
//   node scripts/renombrar.mjs --de Ollita --a Despensita                       (simulacro: solo muestra qué cambiaría)
//   node scripts/renombrar.mjs --de Ollita --a Despensita --aplicar              (aplica los cambios)
//   ... --frase-de "llenar la olla" --frase-a "llenar la despensa"               (también cambia la frase asociada)
//
// Reemplaza tres variantes: Nombre, NOMBRE y nombre (esta última, para nombres de archivo).
// No toca: node_modules, dist, docs, archivo/ (proyecto archivado), MARCA.md (se reescribe a mano) ni este script.
import { readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const de = get("--de"), a = get("--a"), fraseDe = get("--frase-de"), fraseA = get("--frase-a"), aplicar = args.includes("--aplicar");

if (!de || !a) { console.error('Uso: node scripts/renombrar.mjs --de "Nombre viejo" --a "Nombre nuevo" [--frase-de "..." --frase-a "..."] [--aplicar]'); process.exit(1); }
if ((fraseDe && !fraseA) || (!fraseDe && fraseA)) { console.error("--frase-de y --frase-a van juntas."); process.exit(1); }

const SKIP_DIRS = new Set(["node_modules", "dist", "docs", "archivo", ".git", ".claude"]);
const SKIP_FILES = new Set(["MARCA.md", "renombrar.mjs", "package-lock.json"]);
const EXT = new Set([".html", ".js", ".mjs", ".css", ".md", ".json", ".csv", ".ts"]);

const pares = [[de, a], [de.toUpperCase(), a.toUpperCase()], [de.toLowerCase(), a.toLowerCase()]];
if (fraseDe) pares.unshift([fraseDe, fraseA], [fraseDe.charAt(0).toUpperCase() + fraseDe.slice(1), fraseA.charAt(0).toUpperCase() + fraseA.slice(1)]);

function* archivos(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    const st = statSync(p);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(n)) yield* archivos(p); }
    else if (EXT.has(extname(n)) && !SKIP_FILES.has(n)) yield p;
  }
}

let total = 0;
for (const f of archivos(root)) {
  const s = readFileSync(f, "utf8");
  let out = s, n = 0;
  for (const [x, y] of pares) { const partes = out.split(x); n += partes.length - 1; out = partes.join(y); }
  if (!n) continue;
  total += n;
  console.log(`${String(n).padStart(3)}  ${relative(root, f)}`);
  if (aplicar) writeFileSync(f, out);
}
// Archivos cuyo nombre incluye el nombre viejo en mayúsculas (ej. prensa/COMUNICADO-OLLITA.md).
for (const f of archivos(root)) {
  const base = f.split(/[\\/]/).pop();
  if (!base.includes(de.toUpperCase())) continue;
  const nuevo = join(dirname(f), base.split(de.toUpperCase()).join(a.toUpperCase()));
  console.log(`      ${aplicar ? "renombrado" : "se renombraría"}: ${relative(root, f)} → ${relative(root, nuevo)}`);
  if (aplicar) renameSync(f, nuevo);
}

console.log(`\n${aplicar ? "Aplicado" : "Simulacro"}: ${total} reemplazos de «${de}» → «${a}».${aplicar ? "" : " Agregá --aplicar para escribirlos."}`);
if (aplicar) console.log("Siguiente: reescribir MARCA.md a mano, correr `npm test` y revisar el ícono (web/index.html, favicon).");
