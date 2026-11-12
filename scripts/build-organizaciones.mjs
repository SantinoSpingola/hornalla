// Convierte la planilla de organizaciones (CSV) en los datos del mapa, aplicando las reglas de privacidad y verificación.
//
//   node scripts/build-organizaciones.mjs            datos/organizaciones.csv       → web/organizaciones-data.js
//   node scripts/build-organizaciones.mjs --demo     datos/organizaciones.demo.csv  → web/organizaciones-demo-data.js (ficticias)
//
// El proceso SE FRENA (código 1) si alguna fila tiene errores, para que nunca se publique algo a medias.
// Las filas con datos desactualizados se excluyen con un aviso (no frenan el proceso).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Mapa = require("../web/mapa-lib.js");

export const COLUMNAS = [
  "id", "nombre", "tipo", "provincia", "localidad", "barrio", "lat", "lng", "precision", "publicar_direccion", "direccion",
  "horarios", "personas", "como_ayudar", "necesidades", "verificada", "verificada_el", "alias", "titular", "grupo", "dias", "porcion",
  "publicar_contacto", "whatsapp", "email", "consentimiento_fecha", "actualizado",
];

/** CSV tipo RFC 4180 (comillas, comas y saltos de línea dentro de comillas). Detecta , o ; (Excel en español usa ;). */
export function parseCSV(texto) {
  const t = String(texto).replace(/^﻿/, "");
  const primera = t.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primera.match(/;/g) ?? []).length > (primera.match(/,/g) ?? []).length ? ";" : ",";
  const filas = [];
  let fila = [], celda = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { celda += '"'; i++; } else q = false; } else celda += c;
    } else if (c === '"') q = true;
    else if (c === sep) { fila.push(celda); celda = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      fila.push(celda); celda = "";
      if (fila.some((x) => x.trim() !== "")) filas.push(fila);
      fila = [];
    } else celda += c;
  }
  fila.push(celda);
  if (fila.some((x) => x.trim() !== "")) filas.push(fila);
  if (!filas.length) return [];
  const cab = filas[0].map((h) => h.trim().toLowerCase());
  return filas.slice(1).map((f, i) => {
    const o = { _linea: i + 2 };
    cab.forEach((h, j) => { o[h] = (f[j] ?? "").trim(); });
    return o;
  });
}

/** Devuelve { organizaciones, errores:[{linea,id,errores}], avisos:[{linea,id,avisos}], excluidas:[...] } */
export function construir(textoCSV, { hoy, demo = false } = {}) {
  const filas = parseCSV(textoCSV);
  const faltan = textoCSV ? COLUMNAS.filter((c) => filas.length && !(c in filas[0])) : [];
  const organizaciones = [], errores = [], avisos = [], excluidas = [], vistos = new Set();
  if (faltan.length) errores.push({ linea: 1, id: "(encabezado)", errores: ["faltan columnas: " + faltan.join(", ")] });
  else {
    for (const f of filas) {
      const r = Mapa.validarFila(f, { hoy, demo, mesesVigencia: demo ? 600 : undefined });
      if (!r.ok) {
        if (r.errores.every((e) => /desactualizados/.test(e))) excluidas.push({ linea: f._linea, id: r.id, motivo: r.errores[0] });
        else errores.push({ linea: f._linea, id: r.id || "(sin id)", errores: r.errores });
        continue;
      }
      if (vistos.has(r.org.id)) { errores.push({ linea: f._linea, id: r.org.id, errores: ["id repetido"] }); continue; }
      vistos.add(r.org.id);
      organizaciones.push(r.org);
      if (r.avisos.length) avisos.push({ linea: f._linea, id: r.org.id, avisos: r.avisos });
    }
  }
  organizaciones.sort((a, b) => a.provincia.localeCompare(b.provincia, "es") || a.localidad.localeCompare(b.localidad, "es") || a.nombre.localeCompare(b.nombre, "es"));
  return { organizaciones, errores, avisos, excluidas };
}

function principal() {
  const demo = process.argv.includes("--demo");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const entrada = join(root, "datos", demo ? "organizaciones.demo.csv" : "organizaciones.csv");
  const salida = join(root, "web", demo ? "organizaciones-demo-data.js" : "organizaciones-data.js");
  const r = construir(readFileSync(entrada, "utf8"), { demo });

  for (const e of r.errores) console.error(`✗ línea ${e.linea} (${e.id}): ${e.errores.join("; ")}`);
  for (const e of r.excluidas) console.warn(`⚠ línea ${e.linea} (${e.id}) EXCLUIDA: ${e.motivo}`);
  for (const a of r.avisos) console.warn(`• línea ${a.linea} (${a.id}): ${a.avisos.join("; ")}`);
  if (r.errores.length) { console.error(`\n${r.errores.length} fila(s) con errores: no se generó ${salida}. Corregí la planilla y volvé a correr.`); process.exit(1); }

  const global = demo ? "ORGANIZACIONES_DEMO" : "ORGANIZACIONES_DATA";
  const data = { generado: new Date().toISOString(), demo, organizaciones: r.organizaciones };
  writeFileSync(salida, `// GENERADO por scripts/build-organizaciones.mjs — no editar a mano.\nwindow.${global} = ${JSON.stringify(data)};\n`);
  const verificadas = r.organizaciones.filter((o) => o.verificada).length;
  console.log(`${r.organizaciones.length} organizaciones (${verificadas} verificadas, ${r.excluidas.length} excluidas por antigüedad) → ${salida}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) principal();
