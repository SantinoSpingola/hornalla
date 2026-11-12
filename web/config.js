/*
 * Configuración editable de Hornalla. Es lo único que hay que tocar para publicarla.
 * Todo es opcional: lo que quede vacío simplemente no se muestra.
 */
window.CANASTA_CONFIG = {
  // Mail de contacto (se muestra al pie y en el aviso de prueba). Ej.: "hola@tudominio.org"
  email: "",
  // WhatsApp para recibir comentarios; se aceptan espacios, + y guiones. Ej.: "+54 9 11 2233-4455"
  whatsapp: "",
  // true mientras se prueba con organizaciones: muestra «Versión de prueba» con un enlace para contar qué mejorar.
  // Cambiar a false cuando termine el piloto.
  piloto: true,
  // Alias o CBU/CVU denunciados por uso indebido (suplantación de un comedor). La página para donantes los desactiva
  // aunque el enlace siga circulando. Se actualiza agregando el alias y volviendo a publicar el sitio. Ej.: ["alias.estafa"]
  aliasBloqueados: [],
  // Mapa base. Por defecto OpenStreetMap, que sirve para un proyecto chico pero NO para mucho tráfico
  // (https://operations.osmfoundation.org/policies/tiles/). Si crece, usá un proveedor propio o con plan gratuito
  // (MapTiler, Stadia, etc.) y poné acá su URL y la atribución que pida. Dejalo vacío para usar OpenStreetMap.
  mapaTiles: { url: "", atribucion: "", maxZoom: 19 },
};
