import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logisticsAPI, VerifiedPartner, VerifiedRider } from '@/lib/api/logistics';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Users, Package, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface PartnerMetricsProps {
  partner: VerifiedPartner;
  onClose: () => void;
}

interface PartnerMetricsData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalDeliveries: number;
  monthlyDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  activeRiders: number;
  riderSatisfaction: number;
  growthRate: number;
  topServiceAreas: Array<{ area: string; deliveries: number }>;
  monthlyStats: Array<{ month: string; revenue: number; deliveries: number }>;
}

export const PartnerMetrics: React.FC<PartnerMetricsProps> = ({ partner, onClose }) => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<PartnerMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'riders' | 'performance'>('overview');
  const [riders, setRiders] = useState<VerifiedRider[]>([]);

  useEffect(() => {
    fetchMetrics();
    fetchRiders();
  }, [partner.id]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await logisticsAPI.getPartnerMetrics(partner.id);
      setMetrics(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch partner metrics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRiders = async () => {
    try {
      const response = await logisticsAPI.getVerifiedRiders({ 
        status: 'active',
        limit: 100 
      });
      setRiders(response.riders.filter(rider => rider.companyId === partner.id));
    } catch (error: any) {
      console.error('Failed to fetch riders:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-yellow-500';
      case 'terminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Failed to load metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{partner.companyName}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(partner.partnerStatus)}>
              {partner.partnerStatus.charAt(0).toUpperCase() + partner.partnerStatus.slice(1)}
            </Badge>
            <span className="text-sm text-gray-500">
              Partner since {format(new Date(partner.verifiedAt), 'MMM yyyy')}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          className={`pb-2 px-1 ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`pb-2 px-1 ${
            activeTab === 'riders'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('riders')}
        >
          Riders ({riders.length})
        </button>
        <button
          className={`pb-2 px-1 ${
            activeTab === 'performance'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(metrics.growthRate)}
                <span className="ml-1">
                  {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalDeliveries.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(metrics.monthlyDeliveries - (metrics.totalDeliveries / 12))}
                <span className="ml-1">
                  {metrics.monthlyDeliveries} this month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeRiders}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="ml-1">
                  {((metrics.activeRiders / riders.length) * 100).toFixed(1)}% of total riders
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.onTimeDeliveryRate.toFixed(1)}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>Avg: {metrics.averageDeliveryTime} min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Riders Tab */}
      {activeTab === 'riders' && (
        <Card>
          <CardHeader>
            <CardTitle>Active Riders ({riders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riders.map((rider) => (
                <div key={rider.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{rider.fullName}</p>
                      <p className="text-sm text-gray-500 capitalize">{rider.vehicleType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{rider.totalDeliveries} deliveries</p>
                    <p className="text-sm text-gray-500">
                      Γÿà {rider.customerRating?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
              {riders.length === 0 && (
                <p className="text-center text-gray-500 py-8">No active riders found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Service Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Top Service Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topServiceAreas.map((area, index) => (
                  <div key={area.area} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span>{area.area}</span>
                    </div>
                    <span className="font-medium">{area.deliveries} deliveries</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.monthlyStats.map((stat) => (
                  <div key={stat.month} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{stat.month}</p>
                      <p className="text-sm text-gray-500">{stat.deliveries} deliveries</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(stat.revenue)}</p>
                      <p className="text-sm text-gray-500">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
