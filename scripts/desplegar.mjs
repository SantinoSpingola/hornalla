// Publica el sitio ya compilado (web/dist) en Vercel. Lo llama `npm run desplegar` después de `vite build`.
// Copia el vínculo con el proyecto (web/.vercel) y los encabezados (web/vercel.json) a web/dist y publica desde ahí.
import { cpSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const web = join(dirname(fileURLToPath(import.meta.url)), "..", "web");
const dist = join(web, "dist");
if (!existsSync(join(dist, "index.html"))) { console.error("Falta web/dist: corré `npm run build` primero."); process.exit(1); }
if (!existsSync(join(web, ".vercel", "project.json"))) { console.error("Falta web/.vercel/project.json (el vínculo con el proyecto de Vercel)."); process.exit(1); }

cpSync(join(web, ".vercel"), join(dist, ".vercel"), { recursive: true });
cpSync(join(web, "vercel.json"), join(dist, "vercel.json"));
const r = spawnSync("vercel", ["deploy", "--prod", "--yes"], { cwd: dist, stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
