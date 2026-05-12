/**
 * Logo UCompensar — 6 círculos en patrón escalonado
 *
 *   ● ●
 *   ● ●
 *     ● ●
 *
 * Col 1-2 en fila 1 y 2, col 2-3 en fila 3 → efecto diagonal descendente-derecha
 */

const LogoUCompensar = ({ size = 32, color = '#ff6600' }) => {
  const r = 0.28;   // radio como fracción del size
  const g = 0.38;   // gap entre centros como fracción del size

  const s = size;
  const rc = s * r;
  const gc = s * g;

  // 6 círculos: (x, y) en coordenadas absolutas del viewBox [0..size]
  const dots = [
    { x: gc * 0,    y: gc * 0 },   // fila1 col1
    { x: gc * 1,    y: gc * 0 },   // fila1 col2
    { x: gc * 0,    y: gc * 1 },   // fila2 col1
    { x: gc * 1,    y: gc * 1 },   // fila2 col2
    { x: gc * 1,    y: gc * 2 },   // fila3 col2
    { x: gc * 2,    y: gc * 2 },   // fila3 col3
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      aria-label="Logo UCompensar"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x + rc} cy={d.y + rc} r={rc} fill={color} />
      ))}
    </svg>
  );
};

export default LogoUCompensar;
