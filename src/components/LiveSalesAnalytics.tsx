'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Users, Video, Gift, Award, Eye, Activity, Clock, Trophy } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils/formatting';
import { type LiveSalesAnalytics } from '@/lib/api/analytics';

interface LiveSalesAnalyticsProps {
  data: LiveSalesAnalytics | null;
  loading: boolean;
  error: string | null;
}

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}> = ({ icon, label, value, subtext }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </CardContent>
  </Card>
);

const LiveSalesAnalytics: React.FC<LiveSalesAnalyticsProps> = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No live sales analytics data available.
        </CardContent>
      </Card>
    );
  }

  const { currentlyLiveStreams, currentlyLiveVendors, totalActiveViewers, streams, gamification } = data;

  const formatDuration = (startedAt?: string) => {
    if (!startedAt) return '-';
    const minutes = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return `${hours}h ${remaining}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Radio className="h-4 w-4 text-red-500" />}
          label="Currently Live"
          value={formatNumber(currentlyLiveStreams)}
          subtext={`${formatNumber(currentlyLiveVendors)} distinct vendor(s) streaming`}
        />
        <MetricCard
          icon={<Eye className="h-4 w-4 text-blue-500" />}
          label="Active Viewers"
          value={formatNumber(totalActiveViewers)}
          subtext="Watching live streams right now"
        />
        <MetricCard
          icon={<Users className="h-4 w-4 text-green-500" />}
          label="Total Viewers (all-time)"
          value={formatNumber(streams.reduce((sum, s) => sum + s.totalViewers, 0))}
          subtext="Unique viewers across current live streams"
        />
      </div>

      {/* Gamification config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Gamification Configuration
          </CardTitle>
          <CardDescription>Current live sales rewards and leaderboard settings</CardDescription>
        </CardHeader>
        <CardContent>
          {!gamification ? (
            <p className="text-sm text-muted-foreground">No gamification configuration found.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Watch Rewards
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={gamification.watchRewardsEnabled ? 'default' : 'secondary'}>
                      {gamification.watchRewardsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {gamification.watchTimeMinutes} min for {formatCurrency(gamification.fretiPerReward)} FRETI
                  </p>
                  <p className="text-muted-foreground">
                    Daily cap: {formatCurrency(gamification.dailyCapPerUser)} {gamification.dailyCapPerUser === 0 && '(no cap)'}
                  </p>
                  <p className="text-muted-foreground">
                    Per-stream cap: {formatCurrency(gamification.perStreamCapPerUser)} {gamification.perStreamCapPerUser === 0 && '(no cap)'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={gamification.leaderboardEnabled ? 'default' : 'secondary'}>
                      {gamification.leaderboardEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Weights: {gamification.defaultOrderWeight}% / {gamification.defaultViewerWeight}% / {gamification.defaultRevenueWeight}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Special Event
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={gamification.specialEventEnabled ? 'default' : 'secondary'}>
                      {gamification.specialEventEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {gamification.specialEventName && (
                    <p className="text-muted-foreground truncate">{gamification.specialEventName}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live streams table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            Currently Live Streams
          </CardTitle>
          <CardDescription>Vendors streaming right now and their active viewer counts</CardDescription>
        </CardHeader>
        <CardContent>
          {streams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No live streams at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4">Vendor</th>
                    <th className="text-left py-2 pr-4">Title</th>
                    <th className="text-right py-2 pr-4">Live For</th>
                    <th className="text-right py-2 pr-4">Watching Now</th>
                    <th className="text-right py-2 pr-4">Total Viewers</th>
                    <th className="text-right py-2 pr-4">Sales</th>
                    <th className="text-right py-2 pr-4">Gifts</th>
                    <th className="text-right py-2">Gift Value</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map((stream) => (
                    <tr key={stream.streamId} className="border-b border-border/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {stream.vendorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium">{stream.vendorName}</div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium line-clamp-1">{stream.title}</div>
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-0.5">
                          <Radio className="h-3 w-3" />
                          <span>LIVE</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDuration(stream.startedAt)}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold">
                        {formatNumber(stream.currentViewers)}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">
                        {formatNumber(stream.totalViewers)}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">
                        {formatNumber(stream.totalSales)}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">
                        {formatNumber(stream.totalGifts)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatCurrency(stream.totalGiftValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveSalesAnalytics;
