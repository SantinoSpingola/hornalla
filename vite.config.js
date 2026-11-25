import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Las librerías de web/ (formato.js, canasta-lib.js…) son UMD: sirven en Node (tests) y en el navegador.
// Acá se las fuerza a registrarse en `window` aunque el empaquetador las trate como CommonJS.
const UMD = /[\/]web[\/](formato|referencia|canasta-lib|store|org-lib|donante-lib|mapa-lib)\.js$/;
const umdComoGlobal = {
  name: "umd-como-global",
  enforce: "pre",
  transform(code, id) {
    if (UMD.test(id.split("?")[0])) return { code: code.replaceAll('typeof module === "object" && module.exports', "false"), map: null };
  },
};

const web = resolve(import.meta.dirname, "web");

export default defineConfig({
  root: web,
  plugins: [react(), umdComoGlobal],
  server: { port: 4173, strictPort: true },
  preview: { port: 4173 },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(web, "index.html"),
        herramienta: resolve(web, "herramienta.html"),
        mapa: resolve(web, "mapa.html"),
        donar: resolve(web, "donar.html"),
        instructivo: resolve(web, "instructivo.html"),
      },
    },
  },
});
