import { useSyncExternalStore } from "react";
import { Store } from "../lib/globals.js";

/*
 * Estado de la organización (localStorage `hornalla:v1`). Es el mismo almacén de siempre (store.js);
 * acá se lo envuelve para que React se entere de cada cambio.
 */
function almacenamiento() {
  try { const s = window.localStorage; s.getItem("hornalla:test"); return s; } catch { return null; }
}

const base = Store.crear(almacenamiento());
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());

export const store = {
  leer: base.leer,
  get persistente() { return base.persistente; },
  exportarJSON: base.exportarJSON,
  actualizar(fn) { const r = base.actualizar(fn); avisar(); return r; },
  guardar(e) { const r = base.guardar(e); avisar(); return r; },
  importarJSON(t) { const r = base.importarJSON(t); avisar(); return r; },
  borrar() { const r = base.borrar(); avisar(); return r; },
};

const suscribir = (f) => { oyentes.add(f); return () => oyentes.delete(f); };

/** Devuelve el estado actual y vuelve a renderizar cuando cambia. */
export function useEstado() {
  return useSyncExternalStore(suscribir, base.leer, base.leer);
}
