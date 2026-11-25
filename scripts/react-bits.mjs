// Baja componentes de React Bits (https://reactbits.dev) como código fuente propio, igual que el CLI de shadcn/jsrepo.
// Uso: node scripts/react-bits.mjs SplitText CountUp ...   (variante JS + CSS)
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const destino = join(dirname(fileURLToPath(import.meta.url)), "..", "web", "src", "components", "react-bits");
const nombres = process.argv.slice(2);
if (!nombres.length) { console.error("Indicá al menos un componente, por ej.: SplitText"); process.exit(1); }

for (const n of nombres) {
  const r = await fetch(`https://reactbits.dev/r/${n}-JS-CSS.json`);
  if (!r.ok) { console.error(`${n}: no existe (HTTP ${r.status})`); process.exitCode = 1; continue; }
  const item = await r.json();
  for (const f of item.files) {
    const ruta = join(destino, f.path.replace(/^[^/]+\//, n + "/"));
    await mkdir(dirname(ruta), { recursive: true });
    await writeFile(ruta, f.content, "utf8");
    console.log("  +", ruta.slice(destino.length + 1));
  }
  console.log(`${n}: dependencias → ${(item.dependencies || []).join(", ") || "ninguna"}${item.registryDependencies?.length ? " · registro: " + item.registryDependencies.join(", ") : ""}`);
}
