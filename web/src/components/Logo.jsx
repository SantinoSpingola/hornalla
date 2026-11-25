/** La fogata de Hornalla (web/public/logo.png) + el nombre. */
export function LogoMark() {
  return <img className="logo-img" src="/logo.png" alt="" width="46" height="34" aria-hidden="true" decoding="async" />;
}

export default function Logo({ href = "./", label = "Hornalla, inicio" }) {
  return (
    <a className="logo" href={href} aria-label={label}>
      <LogoMark />
      <span>Hornalla</span>
    </a>
  );
}
