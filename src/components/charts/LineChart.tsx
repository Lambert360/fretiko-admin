'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';

interface LineChartData {
  date: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  dataKeys: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  xAxisKey?: string;
  height?: number;
  showLegend?: boolean;
  formatYAxis?: 'currency' | 'number';
}

export function LineChart({
  data,
  dataKeys,
  xAxisKey = 'date',
  height = 300,
  showLegend = true,
  formatYAxis = 'number',
}: LineChartProps) {
  const formatYAxisValue = (value: number) => {
    if (formatYAxis === 'currency') {
      // Show up to 2 decimal places on Y-axis for better readability
      return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    return formatNumber(value);
  };

  const formatTooltipValue = (value: number, name: string) => {
    const dataKey = dataKeys.find(dk => dk.key === name);
    if (formatYAxis === 'currency') {
      // Show full precision in tooltip (2 decimal places)
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
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: 'currentColor', fontSize: 12 }}
          tickFormatter={(value) => {
            try {
              return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch {
              return value;
            }
          }}
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
          labelFormatter={(label) => {
            try {
              return new Date(label).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });
            } catch {
              return label;
            }
          }}
        />
        {showLegend && <Legend />}
        {dataKeys.map(({ key, name, color = '#8884d8' }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

