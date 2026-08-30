export interface ScrapTrendPoint {
  label: string;
  pct: number | null;
}

export default function ScrapTrendChart({ points }: { points: ScrapTrendPoint[] }) {
  const w = 900;
  const h = 260;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const values = points.map((p) => p.pct).filter((v): v is number => v !== null);
  const maxVal = values.length ? Math.max(...values) : 0;
  const niceMax = Math.max(5, Math.ceil((maxVal || 5) / 5) * 5);

  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: padL + i * stepX,
    y: p.pct === null ? null : padT + innerH - (p.pct / niceMax) * innerH,
    pct: p.pct,
  }));
  const validCoords = coords.filter(
    (c): c is { x: number; y: number; pct: number } => c.y !== null
  );
  const linePath = validCoords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (niceMax / yTicks) * i;
    return { val, y: padT + innerH - (val / niceMax) * innerH };
  });

  const labelEvery = Math.max(1, Math.ceil(points.length / 10));

  return (
    <div className="rounded-xl border border-kraft-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-ink-700">Embajio Scrap Percentage</p>
      <p className="mb-3 text-xs text-ink-500/55">
        % de piezas desechadas contra piezas inspeccionadas ese dia.
      </p>
      {validCoords.length === 0 ? (
        <p className="py-10 text-center text-xs text-ink-500/40">
          Aun no hay suficientes datos de produccion y desechos para graficar la tendencia.
        </p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
          {gridLines.map((g) => (
            <g key={g.val}>
              <line
                x1={padL}
                x2={w - padR}
                y1={g.y}
                y2={g.y}
                stroke="var(--color-kraft-200)"
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={g.y + 3}
                textAnchor="end"
                fontSize={9}
                fill="var(--color-ink-500)"
                opacity={0.55}
              >
                {g.val.toFixed(0)}%
              </text>
            </g>
          ))}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-olive-600)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {validCoords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={2.75} fill="var(--color-olive-600)" />
          ))}
          {coords.map((c, i) =>
            i % labelEvery === 0 ? (
              <text
                key={i}
                x={c.x}
                y={h - 10}
                textAnchor="middle"
                fontSize={8}
                fill="var(--color-ink-500)"
                opacity={0.5}
              >
                {points[i].label}
              </text>
            ) : null
          )}
        </svg>
      )}
    </div>
  );
}
