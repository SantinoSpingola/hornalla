export const digitos = (v, max) => String(v).replace(/\D/g, "").slice(0, max || 9);
export const miles = (n) => (n > 0 ? new Intl.NumberFormat("es-AR").format(n) : "");
export const leerMonto = (texto) => Number(digitos(texto, 10)) || 0;
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const esWeb = () => location.protocol.indexOf("http") === 0;
export const mesValido = (v) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
export const fechaCorta = (iso) => { const p = iso.split("-"); return p[2] + "/" + p[1]; };
export const fechaDia = (iso) => { const d = new Date(iso + "T00:00:00"); return ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][d.getDay()] + " " + d.getDate(); };
export const fechaLarga = (iso) => {
  const m = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"], p = iso.split("-");
  return Number(p[2]) + " de " + m[Number(p[1]) - 1] + " de " + p[0];
};
export const reducirMovimiento = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Descarga un texto como archivo (con BOM para que Excel lea bien los acentos). */
export function descargarTexto(nombre, texto, mime) {
  const blob = new Blob(["﻿" + texto], { type: mime + ";charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** SVG de un QR para una URL (cadena vacía si no se puede generar). */
export function svgQR(url) {
  try { const q = window.qrcode(0, "M"); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch { return ""; }
}

/** Imprime mostrando solo el bloque `que` (ver reglas @media print de estilo.css). */
export function imprimir(que) {
  document.body.dataset.imprimir = que;
  const limpiar = () => { delete document.body.dataset.imprimir; window.removeEventListener("afterprint", limpiar); };
  window.addEventListener("afterprint", limpiar);
  window.print();
}
