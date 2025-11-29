'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';

interface BarChartData {
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartData[];
  dataKeys: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  xAxisKey: string;
  height?: number;
  showLegend?: boolean;
  formatYAxis?: 'currency' | 'number';
}

export function BarChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  showLegend = true,
  formatYAxis = 'number',
}: BarChartProps) {
  const formatYAxisValue = (value: number) => {
    if (formatYAxis === 'currency') {
      return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return formatNumber(value);
  };

  const formatTooltipValue = (value: number, name: string) => {
    const dataKey = dataKeys.find(dk => dk.key === name);
    if (formatYAxis === 'currency') {
      return [formatCurrency(value), dataKey?.name || name];
    }
    return [formatNumber(value), dataKey?.name || name];
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: 'currentColor', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tick={{ fill: 'currentColor', fontSize: 12 }}
          tickFormatter={formatYAxisValue}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={formatTooltipValue}
        />
        {showLegend && <Legend />}
        {dataKeys.map(({ key, name, color = '#8884d8' }) => (
          <Bar key={key} dataKey={key} name={name} fill={color} radius={[4, 4, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

