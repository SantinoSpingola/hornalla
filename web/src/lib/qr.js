// tarjetas.js busca `window.qrcode`; se registra acá y se importa antes que él (ver globals.js).
import qrcode from "qrcode-generator";
window.qrcode = qrcode;
export default qrcode;
