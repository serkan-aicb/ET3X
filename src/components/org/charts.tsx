"use client";

/**
 * Dependency-free chart primitives for the org dashboards (frozen build — no
 * chart library). SVG strokes use a fixed accent palette; everything else uses
 * theme tokens so it works in light/dark.
 */

import type { ReactNode } from "react";

export const CHART_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#14b8a6", // teal
  "#ef4444", // red
];

export function StatTile({
  icon,
  label,
  value,
  suffix,
  delta,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {delta && <div className="mt-1 text-xs font-medium text-success">{delta}</div>}
    </div>
  );
}

export function BarList({
  items,
  max = 5,
}: {
  items: { name: string; value: number; color?: string }[];
  max?: number;
}) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={it.name} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm text-foreground">{it.name}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (it.value / max) * 100)}%`,
                backgroundColor: it.color ?? CHART_COLORS[i % CHART_COLORS.length],
              }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-semibold text-foreground">
            {it.value.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  centerValue,
  centerLabel,
  size = 180,
  stroke = 24,
}: {
  segments: { label: string; value: number; color: string }[];
  centerValue: string | number;
  centerLabel: string;
  size?: number;
  stroke?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Precompute each arc's length + start offset without mutating during render.
  const arcs = segments.map((seg, i) => {
    const priorValue = segments.slice(0, i).reduce((s, x) => s + x.value, 0);
    return {
      color: seg.color,
      dash: (seg.value / total) * circ,
      offset: (priorValue / total) * circ,
    };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${circ - a.dash}`}
            strokeDashoffset={-a.offset}
          />
        ))}
      </g>
      <text x="50%" y="47%" textAnchor="middle" className="fill-foreground" style={{ fontSize: 26, fontWeight: 700 }}>
        {centerValue}
      </text>
      <text x="50%" y="60%" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
        {centerLabel}
      </text>
    </svg>
  );
}

export function Legend({ items }: { items: { label: string; value: string; color: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: it.color }} />
          <span className="flex-1 text-muted-foreground">{it.label}</span>
          <span className="font-semibold text-foreground">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function MultiLine({
  series,
  min = 1,
  max = 5,
  height = 220,
}: {
  series: { name: string; points: { label: string; value: number }[] }[];
  min?: number;
  max?: number;
  height?: number;
}) {
  const width = 640;
  const padL = 28;
  const padB = 24;
  const padT = 8;
  const padR = 8;
  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const n = labels.length;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + plotH - ((v - min) / (max - min)) * plotH;
  const ticks = [1, 2, 3, 4, 5].filter((t) => t >= min && t <= max);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="min-w-[520px]" role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={y(t)} x2={width - padR} y2={y(t)} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
            <text x={4} y={y(t) + 3} className="fill-muted-foreground" style={{ fontSize: 10 }}>
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {series.map((s, si) => {
          const color = CHART_COLORS[si % CHART_COLORS.length];
          const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={color} strokeWidth={2} />
              {s.points.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p.value)} r={2.5} fill={color} />
              ))}
            </g>
          );
        })}
        {labels.map((l, i) => (
          <text key={l} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
            {l}
          </text>
        ))}
      </svg>
    </div>
  );
}
