import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, Users, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  overview: {
    totalRiders: number;
    activeRiders: number;
    totalAssignments: number;
    successfulAssignments: number;
    replacementRate: number;
    averageAssignmentTime: number;
  };
  pricingModes: {
    formula: number;
    range: number;
    hybrid: number;
  };
  performance: {
    dailyStats: Array<{
      date: string;
      assignments: number;
      replacements: number;
      successRate: number;
    }>;
    hourlyStats: Array<{
      hour: string;
      assignments: number;
      replacements: number;
    }>;
    riderPerformance: Array<{
      riderId: string;
      riderName: string;
      assignments: number;
      successRate: number;
      averageTime: number;
      rating: number;
    }>;
  };
  replacements: {
    totalReplacements: number;
    vendorSelectionRate: number;
    fastestFingerRate: number;
    averageReplacementTime: number;
    replacementReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  };
}

interface AdminAnalyticsProps {
  onRefresh?: () => void;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ onRefresh }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'pricing' | 'performance' | 'replacements'>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual API
      const mockData: AnalyticsData = {
        overview: {
          totalRiders: 1250,
          activeRiders: 890,
          totalAssignments: 3420,
          successfulAssignments: 3150,
          replacementRate: 8.5,
          averageAssignmentTime: 4.2,
        },
        pricingModes: {
          formula: 850,
          range: 280,
          hybrid: 120,
        },
        performance: {
          dailyStats: [
            { date: 'Mon', assignments: 480, replacements: 35, successRate: 92.7 },
            { date: 'Tue', assignments: 520, replacements: 42, successRate: 91.9 },
            { date: 'Wed', assignments: 490, replacements: 38, successRate: 92.2 },
            { date: 'Thu', assignments: 510, replacements: 45, successRate: 91.2 },
            { date: 'Fri', assignments: 550, replacements: 48, successRate: 91.3 },
            { date: 'Sat', assignments: 420, replacements: 28, successRate: 93.3 },
            { date: 'Sun', assignments: 450, replacements: 32, successRate: 92.9 },
          ],
          hourlyStats: Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            assignments: Math.floor(Math.random() * 50) + 10,
            replacements: Math.floor(Math.random() * 8) + 1,
          })),
          riderPerformance: [
            { riderId: 'rider-1', riderName: 'John Adebayo', assignments: 145, successRate: 96.5, averageTime: 3.8, rating: 4.8 },
            { riderId: 'rider-2', riderName: 'Sarah Okafor', assignments: 132, successRate: 94.7, averageTime: 4.1, rating: 4.9 },
            { riderId: 'rider-3', riderName: 'Ahmed Hassan', assignments: 98, successRate: 92.9, averageTime: 4.5, rating: 4.7 },
            { riderId: 'rider-4', riderName: 'Maria Silva', assignments: 87, successRate: 91.4, averageTime: 4.8, rating: 4.6 },
            { riderId: 'rider-5', riderName: 'David Chen', assignments: 76, successRate: 89.5, averageTime: 5.2, rating: 4.5 },
          ],
        },
        replacements: {
          totalReplacements: 268,
          vendorSelectionRate: 62.3,
          fastestFingerRate: 37.7,
          averageReplacementTime: 8.5,
          replacementReasons: [
            { reason: 'Rider Timeout', count: 145, percentage: 54.1 },
            { reason: 'Rider Rejection', count: 78, percentage: 29.1 },
            { reason: 'Rider Offline', count: 35, percentage: 13.1 },
            { reason: 'Technical Issue', count: 10, percentage: 3.7 },
          ],
        },
      };

      setData(mockData);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
    if (onRefresh) onRefresh();
  };

  const renderOverviewTab = () => {
    if (!data) return null;

    return (
      <div className="tab-content">
        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <Users className="metric-icon" size={24} color="#007AFF" />
            <span className="metric-value">{data.overview.totalRiders}</span>
            <span className="metric-label">Total Riders</span>
          </div>
          
          <div className="metric-card">
            <CheckCircle className="metric-icon" size={24} color="#4CAF50" />
            <span className="metric-value">{data.overview.successfulAssignments}</span>
            <span className="metric-label">Successful</span>
          </div>
          
          <div className="metric-card">
            <RefreshCw className="metric-icon" size={24} color="#FF9800" />
            <span className="metric-value">{data.overview.replacementRate}%</span>
            <span className="metric-label">Replacement Rate</span>
          </div>
          
          <div className="metric-card">
            <Clock className="metric-icon" size={24} color="#9C27B0" />
            <span className="metric-value">{data.overview.averageAssignmentTime}m</span>
            <span className="metric-label">Avg Time</span>
          </div>
        </div>

        {/* Daily Performance Chart */}
        <div className="chart-container">
          <h3 className="chart-title">Daily Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.performance.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="assignments" stroke="#007AFF" strokeWidth={2} name="Assignments" />
              <Line type="monotone" dataKey="replacements" stroke="#FF9800" strokeWidth={2} name="Replacements" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="top-performers-container">
          <h3 className="section-title">Top Performers</h3>
          {data.performance.riderPerformance.slice(0, 5).map((rider, index) => (
            <div key={rider.riderId} className="performer-card">
              <div className="performer-rank">
                <span className="rank-text">#{index + 1}</span>
              </div>
              <div className="performer-info">
                <span className="performer-name">{rider.riderName}</span>
                <div className="performer-stats">
                  <span className="performer-stat">{rider.assignments} assignments</span>
                  <span className="performer-stat">{rider.successRate}% success</span>
                  <span className="performer-stat">{rider.averageTime}m avg</span>
                </div>
              </div>
              <div className="performer-rating">
                <span className="rating-text">⭐ {rider.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPricingTab = () => {
    if (!data) return null;

    const pricingData = [
      { name: 'Formula', value: data.pricingModes.formula, color: '#007AFF' },
      { name: 'Range', value: data.pricingModes.range, color: '#4CAF50' },
      { name: 'Hybrid', value: data.pricingModes.hybrid, color: '#FF9800' },
    ];

    return (
      <div className="tab-content">
        {/* Pricing Mode Distribution */}
        <div className="chart-container">
          <h3 className="chart-title">Pricing Mode Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pricingData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pricingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pricing Mode Stats */}
        <div className="pricing-stats-container">
          <h3 className="section-title">Pricing Mode Statistics</h3>
          {pricingData.map((mode, index) => (
            <div key={mode.name} className="pricing-stat-card">
              <div className="pricing-indicator" style={{ backgroundColor: mode.color }} />
              <div className="pricing-info">
                <span className="pricing-mode">{mode.name}</span>
                <span className="pricing-count">{mode.value} riders</span>
                <span className="pricing-percentage">
                  {((mode.value / data.overview.totalRiders) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Recommendations */}
        <div className="recommendations-container">
          <h3 className="section-title">Pricing Recommendations</h3>
          <div className="recommendation-card">
            <AlertCircle className="recommendation-icon" size={20} color="#FF9800" />
            <span className="recommendation-title">Consider Hybrid Mode</span>
            <span className="recommendation-text">
              Riders using hybrid pricing show 15% higher acceptance rates and 12% better earnings.
            </span>
          </div>
          
          <div className="recommendation-card">
            <TrendingUp className="recommendation-icon" size={20} color="#4CAF50" />
            <span className="recommendation-title">Range Pricing Growth</span>
            <span className="recommendation-text">
              Range pricing adoption increased by 23% this month. Riders prefer price flexibility.
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    if (!data) return null;

    return (
      <div className="tab-content">
        {/* Hourly Performance */}
        <div className="chart-container">
          <h3 className="chart-title">Hourly Assignment Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.performance.hourlyStats.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="assignments" fill="#007AFF" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        <div className="performance-metrics-container">
          <h3 className="section-title">Performance Metrics</h3>
          <div className="performance-grid">
            <div className="performance-card">
              <span className="performance-value">{data.overview.successfulAssignments}</span>
              <span className="performance-label">Successful Assignments</span>
              <span className="performance-change">+12.3%</span>
            </div>
            
            <div className="performance-card">
              <span className="performance-value">{data.overview.averageAssignmentTime}m</span>
              <span className="performance-label">Average Time</span>
              <span className="performance-change">-0.8m</span>
            </div>
            
            <div className="performance-card">
              <span className="performance-value">{data.overview.replacementRate}%</span>
              <span className="performance-label">Replacement Rate</span>
              <span className="performance-change">+2.1%</span>
            </div>
            
            <div className="performance-card">
              <span className="performance-value">{data.overview.activeRiders}</span>
              <span className="performance-label">Active Riders</span>
              <span className="performance-change">+5.2%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReplacementsTab = () => {
    if (!data) return null;

    return (
      <div className="tab-content">
        {/* Replacement Overview */}
        <div className="replacement-overview">
          <h3 className="section-title">Replacement Overview</h3>
          <div className="replacement-stats">
            <div className="replacement-stat">
              <span className="replacement-value">{data.replacements.totalReplacements}</span>
              <span className="replacement-label">Total Replacements</span>
            </div>
            
            <div className="replacement-stat">
              <span className="replacement-value">{data.replacements.vendorSelectionRate}%</span>
              <span className="replacement-label">Vendor Selection</span>
            </div>
            
            <div className="replacement-stat">
              <span className="replacement-value">{data.replacements.fastestFingerRate}%</span>
              <span className="replacement-label">Fastest Finger</span>
            </div>
            
            <div className="replacement-stat">
              <span className="replacement-value">{data.replacements.averageReplacementTime}m</span>
              <span className="replacement-label">Avg Time</span>
            </div>
          </div>
        </div>

        {/* Replacement Reasons */}
        <div className="reasons-container">
          <h3 className="section-title">Replacement Reasons</h3>
          {data.replacements.replacementReasons.map((reason, index) => (
            <div key={reason.reason} className="reason-card">
              <div className="reason-header">
                <span className="reason-text">{reason.reason}</span>
                <span className="reason-count">{reason.count}</span>
              </div>
              <div className="reason-bar">
                <div 
                  className={`reason-progress ${
                    reason.reason === 'Rider Timeout' ? 'reason-progress-timeout' : 
                    reason.reason === 'Rider Rejection' ? 'reason-progress-rejection' : ''
                  }`}
                  style={{ width: `${reason.percentage}%` }}
                />
                <span className="reason-percentage">{reason.percentage}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Replacement Flow Chart */}
        <div className="flow-container">
          <h3 className="section-title">Replacement Success Rate</h3>
          <div className="flow-stats">
            <div className="flow-stage">
              <span className="flow-stage-title">Vendor Selection</span>
              <span className="flow-stage-value">{data.replacements.vendorSelectionRate}%</span>
              <span className="flow-stage-desc">62.3% success rate</span>
            </div>
            
            <TrendingUp className="flow-arrow" size={20} color="#666" />
            
            <div className="flow-stage">
              <span className="flow-stage-title">Fastest Finger</span>
              <span className="flow-stage-value">{data.replacements.fastestFingerRate}%</span>
              <span className="flow-stage-desc">37.7% success rate</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabSelector = () => (
    <div className="tab-selector">
      {[
        { key: 'overview', label: 'Overview', icon: 'grid' },
        { key: 'pricing', label: 'Pricing', icon: 'pricetag' },
        { key: 'performance', label: 'Performance', icon: 'analytics' },
        { key: 'replacements', label: 'Replacements', icon: 'refresh' },
      ].map((tab) => (
        <button
          key={tab.key}
          className={`tab-button ${
            selectedTab === tab.key ? 'active-tab-button' : ''
          }`}
          onClick={() => setSelectedTab(tab.key as any)}
        >
          {tab.icon === 'grid' && <Users size={20} color={selectedTab === tab.key ? '#007AFF' : '#666'} />}
          {tab.icon === 'pricetag' && <TrendingUp size={20} color={selectedTab === tab.key ? '#007AFF' : '#666'} />}
          {tab.icon === 'analytics' && <CheckCircle size={20} color={selectedTab === tab.key ? '#007AFF' : '#666'} />}
          {tab.icon === 'refresh' && <RefreshCw size={20} color={selectedTab === tab.key ? '#007AFF' : '#666'} />}
          <span
            className={`tab-button-text ${
              selectedTab === tab.key ? 'active-tab-button-text' : ''
            }`}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );

  const renderTimeRangeSelector = () => (
    <div className="time-range-selector">
      {[
        { key: '24h', label: '24H' },
        { key: '7d', label: '7D' },
        { key: '30d', label: '30D' },
      ].map((range) => (
        <button
          key={range.key}
          className={`time-range-button ${
            timeRange === range.key ? 'active-time-range-button' : ''
          }`}
          onClick={() => setTimeRange(range.key as any)}
        >
          <span
            className={`time-range-text ${
              timeRange === range.key ? 'active-time-range-text' : ''
            }`}
          >
            {range.label}
          </span>
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <span className="loading-text">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1 className="title">Analytics Dashboard</h1>
        <div className="header-actions">
          {renderTimeRangeSelector()}
          <button className="refresh-button" onClick={handleRefresh}>
            <RefreshCw className="refresh-icon" size={20} color="#007AFF" />
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      {renderTabSelector()}

      {/* Tab Content */}
      <div className="content">
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'pricing' && renderPricingTab()}
        {selectedTab === 'performance' && renderPerformanceTab()}
        {selectedTab === 'replacements' && renderReplacementsTab()}
      </div>
    </div>
  );
};

// Add CSS animation for spinner
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Container styles */
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #F8F9FA;
  }
  
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007AFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    margin-top: 16px;
    font-size: 16px;
    color: #666;
  }
  
  .header {
    padding: 20px;
    background-color: #FFFFFF;
    border-bottom: 1px solid #E1E4E8;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .title {
    font-size: 24px;
    font-weight: bold;
    color: #1F2937;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
  }
  
  .refresh-button {
    padding: 8px;
    border-radius: 8px;
    background-color: #F3F4F6;
    margin-left: 12px;
    border: none;
    cursor: pointer;
  }
  
  .refresh-icon {
    /* Icon styles handled by the component */
  }
  
  .time-range-selector {
    display: flex;
    background-color: #F3F4F6;
    border-radius: 8px;
    padding: 4px;
  }
  
  .time-range-button {
    padding: 8px;
    border-radius: 6px;
    min-width: 40px;
    border: none;
    background: transparent;
    cursor: pointer;
  }
  
  .active-time-range-button {
    background-color: #007AFF;
  }
  
  .time-range-text {
    font-size: 12px;
    font-weight: 500;
    color: #666;
  }
  
  .active-time-range-text {
    color: #FFFFFF;
  }
  
  .tab-selector {
    display: flex;
    background-color: #FFFFFF;
    border-bottom: 1px solid #E1E4E8;
  }
  
  .tab-button {
    flex: 1;
    padding: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
  }
  
  .active-tab-button {
    border-bottom: 2px solid #007AFF;
  }
  
  .tab-button-text {
    font-size: 14px;
    font-weight: 500;
    color: #666;
  }
  
  .active-tab-button-text {
    color: #007AFF;
  }
  
  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .tab-content {
    /* Tab content styles */
  }
  
  .metrics-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .metric-card {
    flex: 1;
    min-width: 150px;
    background-color: #FFFFFF;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  
  .metric-icon {
    margin-bottom: 8px;
  }
  
  .metric-value {
    font-size: 24px;
    font-weight: bold;
    color: #1F2937;
    margin-bottom: 4px;
    display: block;
  }
  
  .metric-label {
    font-size: 12px;
    color: #666;
    display: block;
  }
  
  .chart-container {
    background-color: #FFFFFF;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .chart-title {
    font-size: 18px;
    font-weight: bold;
    color: #1F2937;
    margin-bottom: 16px;
  }
  
  .top-performers-container {
    margin-bottom: 24px;
  }
  
  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #1F2937;
    margin-bottom: 12px;
  }
  
  .performer-card {
    display: flex;
    background-color: #FFFFFF;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    align-items: center;
    border: 1px solid #E1E4E8;
  }
  
  .performer-rank {
    width: 32px;
    height: 32px;
    border-radius: 16px;
    background-color: #007AFF;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 12px;
  }
  
  .rank-text {
    font-size: 12px;
    font-weight: bold;
    color: #FFFFFF;
  }
  
  .performer-info {
    flex: 1;
  }
  
  .performer-name {
    font-size: 14px;
    font-weight: 600;
    color: #1F2937;
    display: block;
    margin-bottom: 2px;
  }
  
  .performer-stats {
    display: flex;
    gap: 8px;
  }
  
  .performer-stat {
    font-size: 11px;
    color: #666;
  }
  
  .performer-rating {
    display: flex;
    align-items: center;
  }
  
  .rating-text {
    font-size: 12px;
    font-weight: 600;
    color: #1F2937;
  }
  
  .pricing-stats-container {
    margin-bottom: 24px;
  }
  
  .pricing-stat-card {
    display: flex;
    background-color: #FFFFFF;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    align-items: center;
    border: 1px solid #E1E4E8;
  }
  
  .pricing-indicator {
    width: 12px;
    height: 12px;
    border-radius: 6px;
    margin-right: 12px;
  }
  
  .pricing-info {
    flex: 1;
  }
  
  .pricing-mode {
    font-size: 14px;
    font-weight: 600;
    color: #1F2937;
    display: block;
    margin-bottom: 2px;
  }
  
  .pricing-count {
    font-size: 12px;
    color: #666;
    display: block;
    margin-bottom: 2px;
  }
  
  .pricing-percentage {
    font-size: 11px;
    color: #666;
  }
  
  .recommendations-container {
    margin-bottom: 24px;
  }
  
  .recommendation-card {
    display: flex;
    background-color: #FFFFFF;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    align-items: flex-start;
    border: 1px solid #E1E4E8;
  }
  
  .recommendation-icon {
    margin-right: 12px;
    margin-top: 2px;
  }
  
  .recommendation-title {
    font-size: 14px;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 4px;
    display: block;
  }
  
  .recommendation-text {
    font-size: 12px;
    color: #666;
    flex: 1;
  }
  
  .performance-metrics-container {
    margin-bottom: 24px;
  }
  
  .performance-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .performance-card {
    flex: 1;
    min-width: 150px;
    background-color: #FFFFFF;
    padding: 16px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid #E1E4E8;
  }
  
  .performance-value {
    font-size: 20px;
    font-weight: bold;
    color: #1F2937;
    display: block;
    margin-bottom: 4px;
  }
  
  .performance-label {
    font-size: 12px;
    color: #666;
    display: block;
    margin-bottom: 2px;
  }
  
  .performance-change {
    font-size: 11px;
    font-weight: 500;
    color: #4CAF50;
  }
  
  .replacement-overview {
    margin-bottom: 24px;
  }
  
  .replacement-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .replacement-stat {
    flex: 1;
    min-width: 150px;
    background-color: #FFFFFF;
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #E1E4E8;
  }
  
  .replacement-value {
    font-size: 20px;
    font-weight: bold;
    color: #1F2937;
    display: block;
    margin-bottom: 4px;
  }
  
  .replacement-label {
    font-size: 12px;
    color: #666;
  }
  
  .reasons-container {
    margin-bottom: 24px;
  }
  
  .reason-card {
    background-color: #FFFFFF;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid #E1E4E8;
  }
  
  .reason-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .reason-text {
    font-size: 14px;
    font-weight: 500;
    color: #1F2937;
  }
  
  .reason-count {
    font-size: 12px;
    color: #666;
  }
  
  .reason-bar {
    display: flex;
    align-items: center;
  }
  
  .reason-progress {
    height: 8px;
    border-radius: 4px;
    background-color: #007AFF;
    margin-right: 8px;
  }
  
  .reason-progress-timeout {
    background-color: #FF9800;
  }
  
  .reason-progress-rejection {
    background-color: #F44336;
  }
  
  .reason-percentage {
    font-size: 11px;
    color: #666;
  }
  
  .flow-container {
    margin-bottom: 24px;
  }
  
  .flow-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: #FFFFFF;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #E1E4E8;
  }
  
  .flow-stage {
    text-align: center;
  }
  
  .flow-stage-title {
    font-size: 12px;
    font-weight: 500;
    color: #1F2937;
    display: block;
    margin-bottom: 4px;
  }
  
  .flow-stage-value {
    font-size: 16px;
    font-weight: bold;
    color: #007AFF;
    display: block;
    margin-bottom: 2px;
  }
  
  .flow-stage-desc {
    font-size: 10px;
    color: #666;
  }
  
  .flow-arrow {
    font-size: 20px;
    color: #666;
  }
`;
  document.head.appendChild(styleSheet);
}

export default AdminAnalytics;
