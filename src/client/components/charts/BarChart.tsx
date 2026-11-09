import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SeriesPoint } from '@shared/types';

export function BarChart({
  data,
  unit = '',
  target = null,
}: {
  data: SeriesPoint[];
  unit?: string;
  target?: number | null;
}) {
  const hasData = data.some((point) => point.value !== null);
  if (!hasData) {
    return <p className="py-8 text-center text-sm text-muted">暂无数据</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted)" />
        <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" />
        {target !== null ? (
          <ReferenceLine
            y={target}
            stroke="var(--muted)"
            strokeDasharray="4 4"
          />
        ) : null}
        <Tooltip
          formatter={(value) => (value == null ? '—' : `${value} ${unit}`)}
        />
        <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
