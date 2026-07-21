import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Users, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { RiderAnalytics } from '@/lib/api/logistics';

type AdminAnalyticsTab = 'overview' | 'performance' | 'status' | 'geography';
type AdminAnalyticsTimeRange = '24h' | '7d' | '30d';

interface AdminAnalyticsProps {
  data?: RiderAnalytics | null;
  loading?: boolean;
  error?: string | null;
  refreshing?: boolean;
  timeRange?: AdminAnalyticsTimeRange;
  onTimeRangeChange?: (range: AdminAnalyticsTimeRange) => void;
  onRefresh?: () => void;
}

const COLORS = {
  blue: '#007AFF',
  green: '#4CAF50',
  orange: '#FF9800',
  red: '#F44336',
  purple: '#9C27B0',
  slate: '#94a3b8',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF9800',
  confirmed: '#2196F3',
  out_for_delivery: '#9C27B0',
  in_transit: '#9C27B0',
  picked_up: '#2196F3',
  delivered: '#4CAF50',
  cancelled: '#F44336',
};

const TAB_CONFIG: { key: AdminAnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Users size={18} /> },
  { key: 'performance', label: 'Performance', icon: <TrendingUp size={18} /> },
  { key: 'status', label: 'Status', icon: <CheckCircle size={18} /> },
  { key: 'geography', label: 'Geography', icon: <MapPin size={18} /> },
];

const TIME_RANGE_CONFIG: { key: AdminAnalyticsTimeRange; label: string }[] = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
];

const MetricCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  className?: string;
}> = ({ icon, value, label, className }) => (
  <Card className={cn('flex-1 min-w-[140px]', className)}>
    <CardContent className="p-4 text-center">
      <div className="mb-2 flex justify-center text-primary">{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-3 text-base font-semibold text-foreground">{children}</h3>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card className="mb-5">
    <CardContent className="p-5">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </CardContent>
  </Card>
);

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  data,
  loading = false,
  error = null,
  refreshing = false,
  timeRange = '24h',
  onTimeRangeChange,
  onRefresh,
}) => {
  const [selectedTab, setSelectedTab] = React.useState<AdminAnalyticsTab>('overview');

  const renderHeader = () => (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-bold text-foreground">Rider Analytics</h1>
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg bg-muted p-1">
          {TIME_RANGE_CONFIG.map((range) => (
            <button
              key={range.key}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                timeRange === range.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onTimeRangeChange?.(range.key)}
            >
              {range.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading || refreshing}
          className="h-8 w-8"
        >
          <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
        </Button>
      </div>
    </div>
  );

  const renderTabSelector = () => (
    <div className="mb-4 flex border-b border-border">
      {TAB_CONFIG.map((tab) => (
        <button
          key={tab.key}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            selectedTab === tab.key
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setSelectedTab(tab.key)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderOverviewTab = () => {
    if (!data) return null;
    const { overview } = data;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <MetricCard
            icon={<Users size={22} style={{ color: COLORS.blue }} />}
            value={overview.totalRiders}
            label="Total Riders"
          />
          <MetricCard
            icon={<CheckCircle size={22} style={{ color: COLORS.green }} />}
            value={overview.successfulAssignments}
            label="Successful"
          />
          <MetricCard
            icon={<RefreshCw size={22} style={{ color: COLORS.orange }} />}
            value={`${overview.replacementRate}%`}
            label="Cancelled Rate"
          />
          <MetricCard
            icon={<Clock size={22} style={{ color: COLORS.purple }} />}
            value={`${overview.averageAssignmentTime}m`}
            label="Avg Assignment Time"
          />
          <MetricCard
            icon={<TrendingUp size={22} style={{ color: COLORS.green }} />}
            value={`${overview.onTimeDeliveryRate}%`}
            label="Delivery Rate"
          />
          <MetricCard
            icon={<Clock size={22} style={{ color: COLORS.blue }} />}
            value={`${overview.averageDeliveryTime}m`}
            label="Avg Delivery Time"
          />
        </div>

        <ChartCard title="Daily Performance">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="assignments" stroke={COLORS.blue} strokeWidth={2} name="Assignments" />
                <Line type="monotone" dataKey="replacements" stroke={COLORS.orange} strokeWidth={2} name="Cancelled" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div>
          <SectionTitle>Top Performers</SectionTitle>
          <div className="space-y-2">
            {data.topPerformers.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">No rider data for this period.</CardContent>
              </Card>
            ) : (
              data.topPerformers.slice(0, 5).map((rider, index) => (
                <Card key={rider.riderId}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{rider.riderName}</div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{rider.assignments} assignments</span>
                        <span>{rider.successRate}% success</span>
                        <span>{rider.averageTime}m avg</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">⭐ {rider.rating}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    if (!data) return null;
    const { overview } = data;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <MetricCard
            icon={<TrendingUp size={22} style={{ color: COLORS.green }} />}
            value={overview.successfulAssignments}
            label="Successful Assignments"
          />
          <MetricCard
            icon={<Clock size={22} style={{ color: COLORS.blue }} />}
            value={`${overview.averageAssignmentTime}m`}
            label="Average Assignment Time"
          />
          <MetricCard
            icon={<RefreshCw size={22} style={{ color: COLORS.orange }} />}
            value={`${overview.replacementRate}%`}
            label="Cancelled Rate"
          />
          <MetricCard
            icon={<Users size={22} style={{ color: COLORS.purple }} />}
            value={overview.activeRiders}
            label="Active Riders"
          />
        </div>

        <ChartCard title="Hourly Assignment Volume">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assignments" fill={COLORS.blue} name="Assignments" />
                <Bar dataKey="replacements" fill={COLORS.orange} name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div>
          <SectionTitle>All Rider Performance</SectionTitle>
          <div className="space-y-2">
            {data.topPerformers.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">No rider performance data for this period.</CardContent>
              </Card>
            ) : (
              data.topPerformers.map((rider) => (
                <Card key={rider.riderId}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{rider.riderName}</div>
                      <div className="text-xs text-muted-foreground">
                        {rider.assignments} assignments · {rider.successRate}% success · {rider.averageTime}m avg
                      </div>
                    </div>
                    <div className="text-sm font-semibold">⭐ {rider.rating}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStatusTab = () => {
    if (!data) return null;
    const { statusBreakdown } = data;
    const statusData = statusBreakdown.map((s) => ({
      name: s.status.replace(/_/g, ' '),
      value: s.count,
      color: STATUS_COLORS[s.status] || COLORS.slate,
    }));

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <MetricCard
            icon={<TrendingUp size={22} style={{ color: COLORS.green }} />}
            value={data.overview.successfulAssignments}
            label="Delivered"
          />
          <MetricCard
            icon={<RefreshCw size={22} style={{ color: COLORS.orange }} />}
            value={data.overview.replacementRate}
            label="Cancelled %"
          />
          <MetricCard
            icon={<Users size={22} style={{ color: COLORS.blue }} />}
            value={data.overview.totalAssignments}
            label="Total Assignments"
          />
          <MetricCard
            icon={<Clock size={22} style={{ color: COLORS.purple }} />}
            value={`${data.overview.averageDeliveryTime}m`}
            label="Avg Delivery Time"
          />
        </div>

        <ChartCard title="Order Status Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div>
          <SectionTitle>Status Breakdown</SectionTitle>
          <div className="space-y-2">
            {statusBreakdown.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">No status data for this period.</CardContent>
              </Card>
            ) : (
              statusBreakdown.map((status) => (
                <Card key={status.status}>
                  <CardContent className="p-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-foreground">{status.status.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">
                        {status.count} ({status.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${status.percentage}%`,
                          backgroundColor: STATUS_COLORS[status.status] || COLORS.slate,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGeographyTab = () => {
    if (!data) return null;
    const { geography } = data;
    const geoData = geography.map((g) => ({ name: g.region, count: g.count, percentage: g.percentage }));

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <MetricCard
            icon={<MapPin size={22} style={{ color: COLORS.blue }} />}
            value={geography.length}
            label="Regions Covered"
          />
          <MetricCard
            icon={<TrendingUp size={22} style={{ color: COLORS.green }} />}
            value={geography[0]?.region ?? 'N/A'}
            label="Top Region"
          />
          <MetricCard
            icon={<Users size={22} style={{ color: COLORS.purple }} />}
            value={geography[0]?.count ?? 0}
            label="Top Region Deliveries"
          />
          <MetricCard
            icon={<Clock size={22} style={{ color: COLORS.orange }} />}
            value={`${geography[0]?.percentage ?? '0'}%`}
            label="Top Region Share"
          />
        </div>

        <ChartCard title="Deliveries by Region">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.blue} name="Deliveries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div>
          <SectionTitle>Regional Breakdown</SectionTitle>
          <div className="space-y-2">
            {geography.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">No regional data available for this period.</CardContent>
              </Card>
            ) : (
              geography.map((region) => (
                <Card key={region.region}>
                  <CardContent className="p-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{region.region}</span>
                      <span className="text-muted-foreground">
                        {region.count} ({region.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${region.percentage}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {renderHeader()}
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <RefreshCw size={20} className="mr-2 animate-spin" />
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {renderHeader()}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4 text-red-700">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {renderHeader()}
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">No analytics data available.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {renderHeader()}
      {renderTabSelector()}
      {selectedTab === 'overview' && renderOverviewTab()}
      {selectedTab === 'performance' && renderPerformanceTab()}
      {selectedTab === 'status' && renderStatusTab()}
      {selectedTab === 'geography' && renderGeographyTab()}
    </div>
  );
};

export default AdminAnalytics;
