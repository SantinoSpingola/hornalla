/*
 * Puente a las librerías de Hornalla (UMD, probadas con `npm test`) y a los datos generados.
 * El orden de los imports importa: cada librería lee de `window` lo que cargó la anterior.
 */
import "../../config.js";
import "../../canasta-data.js";
import "../../precios-data.js";
import "../../organizaciones-data.js";
import "../../formato.js";
import "../../referencia.js";
import "../../canasta-lib.js";
import "../../store.js";
import "../../org-lib.js";
import "../../donante-lib.js";
import "../../mapa-lib.js";
import "./qr.js";
import "../../tarjetas.js";

export const Canasta = window.Canasta;
export const Formato = window.Formato;
export const Store = window.Store;
export const Org = window.Org;
export const Donante = window.Donante;
export const Mapa = window.Mapa;
export const Tarjetas = window.Tarjetas;
export const DATA = window.CANASTA_DATA;
export const PRECIOS = window.PRECIOS_DATA;
export const CONFIG = window.CANASTA_CONFIG || {};
