interface LogoMarkProps {
  size?: number;
  color?: string;
}

export function LogoMark({ size = 32, color = "#ff6600" }: LogoMarkProps) {
  const r = size * 0.28;
  const g = size * 0.38;
  const dots = [
    { x: 0, y: 0 },
    { x: g, y: 0 },
    { x: 0, y: g },
    { x: g, y: g },
    { x: g, y: g * 2 },
    { x: g * 2, y: g * 2 },
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-label="Logo PYMES-AI"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x + r} cy={d.y + r} r={r} style={{ fill: color }} />
      ))}
    </svg>
  );
}
