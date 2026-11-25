import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const Ctx = createContext(() => {});

/** Aviso breve abajo de la pantalla. `const toast = useToast(); toast("Listo.")`. */
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  const t = useRef(0);
  const toast = useCallback((m) => {
    setMsg(m); setOn(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setOn(false), 3200);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className={"toast" + (on ? " on" : "")} role="status" aria-live="polite">{msg}</div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

/** Copia al portapapeles y avisa; si el navegador no deja, muestra el texto para copiar a mano. */
export function useCopiar() {
  const toast = useToast();
  return useCallback((texto, ok) => {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(() => toast(ok), () => window.prompt("Copiá el texto:", texto));
    else window.prompt("Copiá el texto:", texto);
  }, [toast]);
}
