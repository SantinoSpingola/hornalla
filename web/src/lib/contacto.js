import { CONFIG, Mapa } from "./globals.js";

export const CONTACTO = String(CONFIG.email || "").trim();
export const WSP = String(CONFIG.whatsapp || "").replace(/\D/g, "");
export const PILOTO = CONFIG.piloto !== false;
export const ALIAS_BLOQUEADOS = (CONFIG.aliasBloqueados || []).map((a) => String(a).toLowerCase());

/** Enlace para escribir al contacto con un texto armado (WhatsApp primero, después mail). Vacío si no hay contacto. */
export function enlaceContacto({ asunto, cuerpo }) {
  if (WSP) return "https://wa.me/" + WSP + "?text=" + encodeURIComponent(cuerpo);
  if (CONTACTO) return "mailto:" + CONTACTO + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
  return "";
}

export const MENSAJE_ALTA = Mapa ? Mapa.mensajeAlta({}) : "Quiero sumar mi organización al mapa de Hornalla.";
export const HREF_ALTA = enlaceContacto({ asunto: "Sumar mi organización al mapa de Hornalla", cuerpo: MENSAJE_ALTA });
export const HREF_CONTACTO = WSP ? "https://wa.me/" + WSP : CONTACTO ? "mailto:" + CONTACTO : "";
export const ETIQUETA_CONTACTO = CONTACTO || (WSP ? "WhatsApp" : "");
/** Atributos de un enlace de contacto: los de WhatsApp se abren en otra pestaña. */
export const ATRIBUTOS_NUEVA = WSP ? { target: "_blank", rel: "noopener noreferrer" } : {};
