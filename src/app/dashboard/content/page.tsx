'use client';

/**
 * Content Moderation Page
 * 
 * Moderate products, services, stories, and live streams
 * Features:
 * - View all content with filters
 * - Approve/reject products and services
 * - Remove stories
 * - End live streams
 * - View moderation statistics
 * 
 * Requires: view_products permission (and others based on actions)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { contentAPI, type Product, type Service, type Story, type LiveStream, type Auction, type ContentModerationStats } from '@/lib/api/content';
import { contentReportsAPI, type ContentReport, type ContentReportStats, type ReviewContentReportRequest } from '@/lib/api/content-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ExportButton } from '@/components/ui/export-button';
import { formatCurrencyForExport, formatDateForExport } from '@/lib/utils/export';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  Briefcase,
  Image,
  Video,
  Gavel,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  Eye,
  Heart,
  Users,
  DollarSign,
  Loader2,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  MessageSquare,
  FileText,
  Flag,
} from 'lucide-react';

type TabType = 'products' | 'services' | 'stories' | 'live-streams' | 'auctions' | 'content-reports';

export default function ContentModerationPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [stats, setStats] = useState<ContentModerationStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content state
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [contentReports, setContentReports] = useState<ContentReport[]>([]);
  const [contentReportStats, setContentReportStats] = useState<ContentReportStats | null>(null);

  // Filters
  const [productFilters, setProductFilters] = useState({ status: 'all', search: '', page: 1 });
  const [serviceFilters, setServiceFilters] = useState({ status: 'all', search: '', page: 1 });
  const [storyFilters, setStoryFilters] = useState({ search: '', page: 1 });
  const [streamFilters, setStreamFilters] = useState({ status: 'all', page: 1 });
  const [auctionFilters, setAuctionFilters] = useState({ status: 'all', search: '', page: 1 });
  const [contentReportFilters, setContentReportFilters] = useState({ status: 'all' as 'all' | 'pending' | 'under_review' | 'approved' | 'action_taken' | 'dismissed', category: 'all' as 'all' | 'product' | 'service' | 'chat' | 'user', search: '', page: 1 });

  // Moderation dialogs
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; type: string; id: string }>({ open: false, type: '', id: '' });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; type: string; id: string }>({ open: false, type: '', id: '' });
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Content report dialogs
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [isReportDetailDialogOpen, setIsReportDetailDialogOpen] = useState(false);
  const [isReportReviewDialogOpen, setIsReportReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewContentReportRequest>({
    status: 'approved',
    actionTaken: 'no_action',
    actionReason: '',
  });

  // Media viewer dialog
  const [mediaViewer, setMediaViewer] = useState<{
    open: boolean;
    type: 'image' | 'video';
    url: string;
    title?: string;
    allMedia?: Array<{ url: string; type: 'image' | 'video' }>;
    currentIndex?: number;
  }>({ open: false, type: 'image', url: '' });

  const canViewProducts = hasPermission('view_products');
  const canApproveProducts = hasPermission('approve_products');
  const canRemoveProducts = hasPermission('remove_products');
  const canViewServices = hasPermission('view_services');
  const canApproveServices = hasPermission('approve_services');
  const canRemoveServices = hasPermission('remove_services');
  const canViewStories = hasPermission('view_stories');
  const canRemoveStories = hasPermission('remove_stories');
  const canViewStreams = hasPermission('view_live_streams');
  const canEndStreams = hasPermission('end_live_streams');

  useEffect(() => {
    if (canViewProducts) {
      fetchStats();
      if (activeTab === 'content-reports') {
        fetchContentReportStats();
      }
      fetchContent();
    }
  }, [activeTab, productFilters, serviceFilters, storyFilters, streamFilters, auctionFilters, contentReportFilters]);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await contentAPI.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchContentReportStats = async () => {
    try {
      const statsData = await contentReportsAPI.getStats();
      setContentReportStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch content report stats:', err);
    }
  };

  const fetchContent = async () => {
    try {
      setIsLoadingContent(true);
      setError(null);

      switch (activeTab) {
        case 'products':
          if (canViewProducts) {
            const productsData = await contentAPI.getProducts(productFilters);
            setProducts(productsData.products || []);
          }
          break;
        case 'services':
          if (canViewServices) {
            const servicesData = await contentAPI.getServices(serviceFilters);
            setServices(servicesData.services || []);
          }
          break;
        case 'stories':
          if (canViewStories) {
            const storiesData = await contentAPI.getStories(storyFilters);
            setStories(storiesData.stories || []);
          }
          break;
        case 'live-streams':
          if (canViewStreams) {
            const streamsData = await contentAPI.getLiveStreams(streamFilters);
            setLiveStreams(streamsData.streams || []);
          }
          break;
        case 'auctions':
          if (canViewProducts) {
            const auctionsData = await contentAPI.getAuctions(auctionFilters);
            setAuctions(auctionsData.auctions || []);
          }
          break;
        case 'content-reports':
          if (canViewProducts) {
            const reportsData = await contentReportsAPI.getReports({
              status: contentReportFilters.status !== 'all' ? contentReportFilters.status : undefined,
              category: contentReportFilters.category !== 'all' ? contentReportFilters.category : undefined,
              search: contentReportFilters.search || undefined,
              page: contentReportFilters.page,
              limit: 20,
            });
            setContentReports(reportsData.reports);
          }
          break;
      }
    } catch (err: any) {
      console.error('Failed to fetch content:', err);
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      if (approveDialog.type === 'product') {
        await contentAPI.approveProduct(approveDialog.id, reason);
      } else if (approveDialog.type === 'service') {
        await contentAPI.approveService(approveDialog.id, reason);
      } else if (approveDialog.type === 'auction') {
        await contentAPI.approveAuction(approveDialog.id, reason);
      }
      setApproveDialog({ open: false, type: '', id: '' });
      setReason('');
      await fetchContent();
      await fetchStats();
      toast({
        title: 'Success',
        description: `${approveDialog.type === 'product' ? 'Product' : approveDialog.type === 'service' ? 'Service' : 'Auction'} approved successfully`,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to approve';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (rejectDialog.type === 'product') {
        await contentAPI.rejectProduct(rejectDialog.id, reason);
      } else if (rejectDialog.type === 'service') {
        await contentAPI.rejectService(rejectDialog.id, reason);
      } else if (rejectDialog.type === 'story') {
        await contentAPI.removeStory(rejectDialog.id, reason);
      } else if (rejectDialog.type === 'stream') {
        await contentAPI.endLiveStream(rejectDialog.id, reason);
      } else if (rejectDialog.type === 'auction') {
        await contentAPI.rejectAuction(rejectDialog.id, reason);
      }
      setRejectDialog({ open: false, type: '', id: '' });
      setReason('');
      await fetchContent();
      await fetchStats();
      
      const actionMessages: Record<string, string> = {
        product: 'Product rejected successfully',
        service: 'Service rejected successfully',
        story: 'Story removed successfully',
        stream: 'Live stream ended successfully',
        auction: 'Auction cancelled successfully',
      };
      
      toast({
        title: 'Success',
        description: actionMessages[rejectDialog.type] || 'Action completed successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to perform action';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canViewProducts && !canViewServices && !canViewStories && !canViewStreams) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to moderate content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and moderate platform content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setIsLoadingContent(true);
              await fetchContent();
              await fetchStats();
              setIsLoadingContent(false);
            }}
            disabled={isLoadingContent}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingContent ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {activeTab === 'products' && (
            <ExportButton
              data={products.map(product => ({
                'Product ID': product.id,
                'Title': product.name,
                'Vendor': product.user?.preferences?.fullName || product.user?.full_name || product.user?.username || 'Unknown',
                'Price': formatCurrencyForExport(product.price),
                'Status': product.status,
                'Created': formatDateForExport(product.created_at),
              }))}
              filename="products"
              headers={['Product ID', 'Title', 'Vendor', 'Price', 'Status', 'Created']}
              disabled={isLoadingContent || products.length === 0}
            />
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {isLoadingStats ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{stats.products.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.products.pending} pending
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-2xl font-bold">{stats.services.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.services.pending} pending
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stories</p>
                  <p className="text-2xl font-bold">{stats.stories.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.stories.active} active
                  </p>
                </div>
                <Image className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Live Streams</p>
                  <p className="text-2xl font-bold">{stats.liveStreams.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.liveStreams.live} live
                  </p>
                </div>
                <Video className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auctions</p>
                  <p className="text-2xl font-bold">{stats.auctions.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.auctions.active} active
                  </p>
                </div>
                <Gavel className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {canViewProducts && (
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Products
            </button>
          )}
          {canViewServices && (
            <button
              onClick={() => setActiveTab('services')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Services
            </button>
          )}
          {canViewStories && (
            <button
              onClick={() => setActiveTab('stories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stories
            </button>
          )}
          {canViewStreams && (
            <button
              onClick={() => setActiveTab('live-streams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'live-streams'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Live Streams
            </button>
          )}
          {canViewProducts && (
            <button
              onClick={() => setActiveTab('auctions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'auctions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Auctions
            </button>
          )}
          {canViewProducts && (
            <button
              onClick={() => setActiveTab('content-reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content-reports'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Content Reports
            </button>
          )}
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Content Area */}
      {isLoadingContent ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Products Tab */}
          {activeTab === 'products' && canViewProducts && (
            <ProductsTab
              products={products}
              filters={productFilters}
              onFiltersChange={setProductFilters}
              onApprove={(id) => setApproveDialog({ open: true, type: 'product', id })}
              onReject={(id) => setRejectDialog({ open: true, type: 'product', id })}
              onViewMedia={(url, type, allMedia, product) => {
                if (!allMedia || allMedia.length === 0 || !product) {
                  setMediaViewer({
                    open: true,
                    type: type || 'image',
                    url,
                  });
                  return;
                }
                // Map media with correct types: check if URL is in videos or images array
                const mappedMedia = allMedia.map(m => {
                  const isVideo = (product.primary_video_url === m && product.media_type === 'video') ||
                    (product.videos || []).includes(m);
                  return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                });
                const currentIdx = allMedia.findIndex(m => m === url);
                setMediaViewer({
                  open: true,
                  type: type || 'image',
                  url,
                  allMedia: mappedMedia,
                  currentIndex: currentIdx >= 0 ? currentIdx : 0,
                });
              }}
              canApprove={canApproveProducts}
              canRemove={canRemoveProducts}
            />
          )}

          {/* Services Tab */}
          {activeTab === 'services' && canViewServices && (
            <ServicesTab
              services={services}
              filters={serviceFilters}
              onFiltersChange={setServiceFilters}
              onApprove={(id) => setApproveDialog({ open: true, type: 'service', id })}
              onReject={(id) => setRejectDialog({ open: true, type: 'service', id })}
              onViewMedia={(url, type, allMedia, service) => {
                if (!allMedia || allMedia.length === 0 || !service) {
                  setMediaViewer({
                    open: true,
                    type: type || 'image',
                    url,
                  });
                  return;
                }
                // Map media with correct types: check if URL is in videos or images array
                const mappedMedia = allMedia.map(m => {
                  const isVideo = (service.primary_media_url === m && service.media_type === 'video') ||
                    (service.videos || []).includes(m);
                  return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                });
                const currentIdx = allMedia.findIndex(m => m === url);
                setMediaViewer({
                  open: true,
                  type: type || 'image',
                  url,
                  allMedia: mappedMedia,
                  currentIndex: currentIdx >= 0 ? currentIdx : 0,
                });
              }}
              canApprove={canApproveServices}
              canRemove={canRemoveServices}
            />
          )}

          {/* Stories Tab */}
          {activeTab === 'stories' && canViewStories && (
            <StoriesTab
              stories={stories}
              filters={storyFilters}
              onFiltersChange={setStoryFilters}
              onRemove={(id) => setRejectDialog({ open: true, type: 'story', id })}
              onViewMedia={(url, type) => {
                setMediaViewer({
                  open: true,
                  type: type || 'image',
                  url,
                });
              }}
              canRemove={canRemoveStories}
            />
          )}

          {/* Live Streams Tab */}
          {activeTab === 'live-streams' && canViewStreams && (
            <LiveStreamsTab
              streams={liveStreams}
              filters={streamFilters}
              onFiltersChange={setStreamFilters}
              onEnd={(id) => setRejectDialog({ open: true, type: 'stream', id })}
              onViewMedia={(url) => {
                setMediaViewer({
                  open: true,
                  type: 'image',
                  url,
                });
              }}
              canEnd={canEndStreams}
            />
          )}

          {/* Auctions Tab */}
          {activeTab === 'auctions' && canViewProducts && (
            <AuctionsTab
              auctions={auctions}
              filters={auctionFilters}
              onFiltersChange={setAuctionFilters}
              onApprove={(id) => setApproveDialog({ open: true, type: 'auction', id })}
              onReject={(id) => setRejectDialog({ open: true, type: 'auction', id })}
              onViewMedia={(url, allImages) => {
                setMediaViewer({
                  open: true,
                  type: 'image',
                  url,
                  allMedia: allImages?.map(img => ({ url: img, type: 'image' as const })),
                  currentIndex: allImages?.findIndex(img => img === url) ?? 0,
                });
              }}
              canApprove={canApproveProducts}
              canRemove={canRemoveProducts}
            />
          )}

          {/* Content Reports Tab */}
          {activeTab === 'content-reports' && canViewProducts && (
            <ContentReportsTab
              reports={contentReports}
              stats={contentReportStats}
              filters={contentReportFilters}
              onFiltersChange={setContentReportFilters}
              onViewDetails={async (reportId) => {
                try {
                  const report = await contentReportsAPI.getReport(reportId);
                  setSelectedReport(report);
                  setIsReportDetailDialogOpen(true);
                } catch (err: any) {
                  toast({
                    title: 'Error',
                    description: 'Failed to load report details',
                    variant: 'destructive',
                  });
                }
              }}
              onReview={(reportId) => {
                const report = contentReports.find(r => r.id === reportId);
                if (report) {
                  setSelectedReport(report);
                  setReviewForm({ status: 'approved', actionTaken: 'no_action', actionReason: '' });
                  setIsReportReviewDialogOpen(true);
                }
              }}
              canReview={canApproveProducts}
            />
          )}
        </>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => !open && setApproveDialog({ open: false, type: '', id: '' })}>
        <DialogContent>
          <DialogClose onClose={() => {
            setApproveDialog({ open: false, type: '', id: '' });
            setReason('');
          }} />
          <DialogHeader>
            <DialogTitle>
              Approve {approveDialog.type === 'product' ? 'Product' : approveDialog.type === 'service' ? 'Service' : 'Auction'}
            </DialogTitle>
            <DialogDescription>
              Approve this {approveDialog.type} to make it visible on the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a note about why this was approved..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialog({ open: false, type: '', id: '' });
                setReason('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject/Remove Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, type: '', id: '' })}>
        <DialogContent>
          <DialogClose onClose={() => {
            setRejectDialog({ open: false, type: '', id: '' });
            setReason('');
          }} />
          <DialogHeader>
            <DialogTitle>
              {rejectDialog.type === 'product' || rejectDialog.type === 'service' || rejectDialog.type === 'auction'
                ? 'Reject'
                : rejectDialog.type === 'story'
                ? 'Remove Story'
                : 'End Live Stream'}
            </DialogTitle>
            <DialogDescription>
              {rejectDialog.type === 'stream'
                ? 'End this live stream immediately'
                : rejectDialog.type === 'auction'
                ? 'Cancel this auction and prevent it from going live'
                : `Provide a reason for ${rejectDialog.type === 'story' ? 'removing' : 'rejecting'} this content`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason *</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this content is being removed..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, type: '', id: '' });
                setReason('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? 'Processing...' : rejectDialog.type === 'stream' ? 'End Stream' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Report Detail Dialog */}
      <Dialog open={isReportDetailDialogOpen} onOpenChange={setIsReportDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Report Details</DialogTitle>
            <DialogDescription>
              Review the full details of this content report
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedReport.status === 'pending' ? 'secondary' : selectedReport.status === 'action_taken' ? 'default' : 'outline'}>
                      {selectedReport.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="mt-1 flex items-center gap-2 capitalize">
                    {selectedReport.reportCategory === 'product' && <Package className="h-4 w-4" />}
                    {selectedReport.reportCategory === 'service' && <Briefcase className="h-4 w-4" />}
                    {selectedReport.reportCategory === 'chat' && <MessageSquare className="h-4 w-4" />}
                    {selectedReport.reportCategory === 'user' && <User className="h-4 w-4" />}
                    {selectedReport.reportCategory}
                  </div>
                </div>
                <div>
                  <Label>Report Type</Label>
                  <p className="mt-1 text-sm capitalize">{selectedReport.reportType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <Label>Reported By</Label>
                  <p className="mt-1 text-sm">{selectedReport.reporterName || 'Unknown'}</p>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p className="mt-1 text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
                {selectedReport.moderatedAt && (
                  <div>
                    <Label>Moderated At</Label>
                    <p className="mt-1 text-sm">{new Date(selectedReport.moderatedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div>
                <Label>Reason</Label>
                <p className="mt-1 text-sm">{selectedReport.reason}</p>
              </div>
              {selectedReport.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm">{selectedReport.description}</p>
                </div>
              )}
              {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                <div>
                  <Label>Evidence</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedReport.evidence.map((item, idx) => (
                      <div key={idx} className="border rounded p-2">
                        {item.type === 'image' ? (
                          <img src={item.url} alt={item.description} className="w-full h-32 object-cover rounded" />
                        ) : (
                          <div className="flex items-center gap-2 p-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm">{item.description}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedReport.actionTaken && (
                <div>
                  <Label>Action Taken</Label>
                  <p className="mt-1 text-sm capitalize">{selectedReport.actionTaken.replace(/_/g, ' ')}</p>
                  {selectedReport.actionReason && (
                    <p className="mt-1 text-sm text-muted-foreground">{selectedReport.actionReason}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {canApproveProducts && selectedReport?.status === 'pending' && (
              <Button
                onClick={() => {
                  setIsReportDetailDialogOpen(false);
                  setReviewForm({ status: 'approved', actionTaken: 'no_action', actionReason: '' });
                  setIsReportReviewDialogOpen(true);
                }}
              >
                Review Report
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsReportDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Report Review Dialog */}
      <Dialog open={isReportReviewDialogOpen} onOpenChange={setIsReportReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Content Report</DialogTitle>
            <DialogDescription>
              Take action on this content report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <select
                value={reviewForm.status}
                onChange={(e) => {
                  const status = e.target.value as 'approved' | 'action_taken' | 'dismissed';
                  setReviewForm(prev => ({
                    ...prev,
                    status,
                    actionTaken: status === 'action_taken' ? prev.actionTaken : undefined,
                  }));
                }}
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="approved">Approve (No Action)</option>
                <option value="action_taken">Take Action</option>
                <option value="dismissed">Dismiss</option>
              </select>
            </div>
            {reviewForm.status === 'action_taken' && (
              <div>
                <Label>Action Type</Label>
                <select
                  value={reviewForm.actionTaken || 'no_action'}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, actionTaken: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                >
                  <option value="no_action">No Action</option>
                  <option value="content_removed">Remove Content</option>
                  <option value="content_hidden">Hide Content</option>
                  <option value="user_warned">Warn User</option>
                  <option value="user_suspended">Suspend User</option>
                  <option value="user_banned">Ban User</option>
                </select>
              </div>
            )}
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={reviewForm.actionReason}
                onChange={(e) => setReviewForm(prev => ({ ...prev, actionReason: e.target.value }))}
                placeholder="Explain your decision..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportReviewDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!selectedReport || !reviewForm.actionReason.trim()) {
                  toast({
                    title: 'Validation Error',
                    description: 'Please provide a reason for your action',
                    variant: 'destructive',
                  });
                  return;
                }
                try {
                  setIsSubmitting(true);
                  await contentReportsAPI.reviewReport(selectedReport.id, reviewForm);
                  toast({
                    title: 'Success',
                    description: 'Report reviewed successfully',
                  });
                  setIsReportReviewDialogOpen(false);
                  setReviewForm({ status: 'approved', actionTaken: 'no_action', actionReason: '' });
                  await fetchContent();
                  await fetchContentReportStats();
                } catch (err: any) {
                  toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to review report',
                    variant: 'destructive',
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }} 
              disabled={isSubmitting || !reviewForm.actionReason.trim()}
            >
              {isSubmitting ? 'Processing...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Viewer Dialog */}
      <Dialog open={mediaViewer.open} onOpenChange={(open) => setMediaViewer({ ...mediaViewer, open })}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setMediaViewer({ ...mediaViewer, open: false })}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {mediaViewer.allMedia && mediaViewer.allMedia.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                  onClick={() => {
                    setMediaViewer(prev => {
                      if (!prev.allMedia || prev.allMedia.length <= 1) return prev;
                      const currentIdx = prev.currentIndex ?? 0;
                      const prevIdx = currentIdx > 0 ? currentIdx - 1 : prev.allMedia.length - 1;
                      const prevMedia = prev.allMedia[prevIdx];
                      return {
                        ...prev,
                        url: prevMedia.url,
                        type: prevMedia.type,
                        currentIndex: prevIdx,
                      };
                    });
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-12 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                  onClick={() => {
                    setMediaViewer(prev => {
                      if (!prev.allMedia || prev.allMedia.length <= 1) return prev;
                      const currentIdx = prev.currentIndex ?? 0;
                      const nextIdx = currentIdx < prev.allMedia.length - 1 ? currentIdx + 1 : 0;
                      const nextMedia = prev.allMedia[nextIdx];
                      return {
                        ...prev,
                        url: nextMedia.url,
                        type: nextMedia.type,
                        currentIndex: nextIdx,
                      };
                    });
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 px-3 py-1 rounded-md text-sm">
                  {(mediaViewer.currentIndex ?? 0) + 1} / {mediaViewer.allMedia.length}
                </div>
              </>
            )}

            <div className="flex items-center justify-center min-h-[60vh] max-h-[85vh] p-4">
              {mediaViewer.type === 'video' ? (
                <video
                  src={mediaViewer.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh] rounded-lg"
                />
              ) : (
                <img
                  src={mediaViewer.url}
                  alt={mediaViewer.title || 'Media'}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Products Tab Component
function ProductsTab({
  products,
  filters,
  onFiltersChange,
  onApprove,
  onReject,
  onViewMedia,
  canApprove,
  canRemove,
}: {
  products: Product[];
  filters: any;
  onFiltersChange: (filters: any) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewMedia: (url: string, type?: 'image' | 'video', allMedia?: string[], product?: Product) => void;
  canApprove: boolean;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
            className="pl-10"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value, page: 1 })}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Products List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {product.user?.preferences?.fullName || product.user?.full_name || product.user?.username || 'Unknown User'}
                  </CardDescription>
                </div>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(product.primary_image_url || product.primary_video_url) && (
                product.media_type === 'video' && product.primary_video_url ? (
                  <video
                    src={product.primary_video_url}
                    className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (!product.primary_video_url) return;
                      // Remove duplicates by using Set
                      const allMedia = Array.from(new Set([
                        product.primary_video_url,
                        ...(product.videos || []),
                        ...(product.images || []),
                        product.primary_image_url
                      ])).filter((url): url is string => Boolean(url));
                      onViewMedia(product.primary_video_url, 'video', allMedia, product);
                    }}
                  />
                ) : product.primary_image_url ? (
                  <img
                    src={product.primary_image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (!product.primary_image_url) return;
                      // Remove duplicates by using Set
                      const allMedia = Array.from(new Set([
                        product.primary_image_url,
                        ...(product.images || []),
                        ...(product.videos || []),
                        product.primary_video_url
                      ])).filter((url): url is string => Boolean(url));
                      onViewMedia(product.primary_image_url, 'image', allMedia, product);
                    }}
                  />
                ) : null
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">${product.price.toLocaleString()}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {product.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {product.like_count}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {canApprove && product.status === 'draft' && (
                  <Button size="sm" variant="outline" onClick={() => onApprove(product.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
                {canRemove && (
                  <Button size="sm" variant="destructive" onClick={() => onReject(product.id)}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {products.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No products found</div>
      )}
    </div>
  );
}

// Services Tab Component
function ServicesTab({
  services,
  filters,
  onFiltersChange,
  onApprove,
  onReject,
  onViewMedia,
  canApprove,
  canRemove,
}: {
  services: Service[];
  filters: any;
  onFiltersChange: (filters: any) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewMedia: (url: string, type?: 'image' | 'video', allMedia?: string[], service?: Service) => void;
  canApprove: boolean;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
            className="pl-10"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value, page: 1 })}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="busy">Busy</option>
        </select>
      </div>

      {/* Services List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{service.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {service.user?.preferences?.fullName || service.user?.full_name || service.user?.username || 'Unknown User'}
                  </CardDescription>
                </div>
                <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                  {service.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.primary_media_url && (
                service.media_type === 'video' ? (
                  <video
                    src={service.primary_media_url}
                    className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (!service.primary_media_url) return;
                      // Remove duplicates by using Set
                      const allMedia = Array.from(new Set([
                        service.primary_media_url,
                        ...(service.videos || []),
                        ...(service.images || [])
                      ]));
                      onViewMedia(service.primary_media_url, 'video', allMedia, service);
                    }}
                  />
                ) : (
                  <img
                    src={service.primary_media_url}
                    alt={service.name}
                    className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (!service.primary_media_url) return;
                      // Remove duplicates by using Set
                      const allMedia = Array.from(new Set([
                        service.primary_media_url,
                        ...(service.images || []),
                        ...(service.videos || [])
                      ]));
                      onViewMedia(service.primary_media_url, 'image', allMedia, service);
                    }}
                  />
                )
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">${service.base_price.toLocaleString()}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {service.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {service.like_count}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {canApprove && service.status === 'draft' && (
                  <Button size="sm" variant="outline" onClick={() => onApprove(service.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
                {canRemove && (
                  <Button size="sm" variant="destructive" onClick={() => onReject(service.id)}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {services.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No services found</div>
      )}
    </div>
  );
}

// Stories Tab Component
function StoriesTab({
  stories,
  filters,
  onFiltersChange,
  onRemove,
  onViewMedia,
  canRemove,
}: {
  stories: Story[];
  filters: any;
  onFiltersChange: (filters: any) => void;
  onRemove: (id: string) => void;
  onViewMedia: (url: string, type?: 'image' | 'video') => void;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stories..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
          className="pl-10"
        />
      </div>

      {/* Stories List */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {stories.map((story) => (
          <Card key={story.id}>
            <CardContent className="p-0">
              {story.media_type === 'video' ? (
                <video
                  src={story.media_url}
                  className="w-full h-64 object-cover rounded-t-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onViewMedia(story.media_url, 'video')}
                />
              ) : (
                <img
                  src={story.media_url}
                  alt={story.caption || 'Story'}
                  className="w-full h-64 object-cover rounded-t-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onViewMedia(story.media_url, 'image')}
                />
              )}
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium">{story.user?.preferences?.fullName || story.user?.full_name || story.user?.username}</p>
                {story.caption && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{story.caption}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {story.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {story.like_count}
                  </span>
                </div>
                {canRemove && (
                  <Button size="sm" variant="destructive" className="w-full mt-2" onClick={() => onRemove(story.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {stories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No stories found</div>
      )}
    </div>
  );
}

// Live Streams Tab Component
function LiveStreamsTab({
  streams,
  filters,
  onFiltersChange,
  onEnd,
  onViewMedia,
  canEnd,
}: {
  streams: LiveStream[];
  filters: any;
  onFiltersChange: (filters: any) => void;
  onEnd: (id: string) => void;
  onViewMedia: (url: string) => void;
  canEnd: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <select
        value={filters.status}
        onChange={(e) => onFiltersChange({ ...filters, status: e.target.value, page: 1 })}
        className="px-3 py-2 border rounded-md bg-background"
      >
        <option value="all">All Status</option>
        <option value="setup">Setup</option>
        <option value="live">Live</option>
        <option value="paused">Paused</option>
        <option value="ended">Ended</option>
      </select>

      {/* Streams List */}
      <div className="grid gap-4 md:grid-cols-2">
        {streams.map((stream) => (
          <Card key={stream.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{stream.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {stream.vendor?.preferences?.fullName || stream.vendor?.full_name || stream.vendor?.username || 'Unknown Vendor'}
                  </CardDescription>
                </div>
                <Badge variant={stream.status === 'live' ? 'destructive' : 'secondary'}>
                  {stream.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stream.thumbnail_url && (
                <img
                  src={stream.thumbnail_url}
                  alt={stream.title}
                  className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onViewMedia(stream.thumbnail_url!)}
                />
              )}
              {stream.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{stream.description}</p>
              )}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Viewers</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {stream.viewer_count}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Sales</p>
                  <p className="font-semibold flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ${stream.total_sales.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{stream.stream_type}</p>
                </div>
              </div>
              {canEnd && stream.status === 'live' && (
                <Button size="sm" variant="destructive" className="w-full" onClick={() => onEnd(stream.id)}>
                  <XCircle className="h-4 w-4 mr-1" />
                  End Stream
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {streams.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No live streams found</div>
      )}
    </div>
  );
}

// Auctions Tab Component
function AuctionsTab({
  auctions,
  filters,
  onFiltersChange,
  onApprove,
  onReject,
  onViewMedia,
  canApprove,
  canRemove,
}: {
  auctions: Auction[];
  filters: any;
  onFiltersChange: (filters: any) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewMedia: (url: string, allImages?: string[]) => void;
  canApprove: boolean;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search auctions..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
            className="pl-10"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value, page: 1 })}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
          <option value="cancelled">Cancelled</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Auctions List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {auctions.map((auction) => (
          <Card key={auction.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{auction.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {auction.seller?.preferences?.fullName || auction.seller?.full_name || auction.seller?.username || 'Unknown Seller'}
                  </CardDescription>
                </div>
                <Badge variant={auction.status === 'active' ? 'default' : auction.status === 'sold' ? 'default' : 'secondary'}>
                  {auction.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {auction.thumbnail_url && (
                <img
                  src={auction.thumbnail_url}
                  alt={auction.title}
                  className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    const thumbnailUrl = auction.thumbnail_url;
                    if (!thumbnailUrl) return;
                    // Remove duplicates by using Set
                    const allImages = Array.from(new Set([
                      thumbnailUrl,
                      ...(auction.images || [])
                    ]));
                    onViewMedia(thumbnailUrl, allImages);
                  }}
                />
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">{auction.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Starting Price</p>
                  <p className="font-semibold">${auction.starting_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Bid</p>
                  <p className="font-semibold">${auction.current_bid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{auction.auction_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bids</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {auction.total_bids}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(auction.end_time).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {auction.view_count}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                {canApprove && auction.status === 'scheduled' && (
                  <Button size="sm" variant="outline" onClick={() => onApprove(auction.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
                {canRemove && (
                  <Button size="sm" variant="destructive" onClick={() => onReject(auction.id)}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {auctions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No auctions found</div>
      )}
    </div>
  );
}

// Content Reports Tab Component
function ContentReportsTab({
  reports,
  stats,
  filters,
  onFiltersChange,
  onViewDetails,
  onReview,
  canReview,
}: {
  reports: ContentReport[];
  stats: ContentReportStats | null;
  filters: { status: 'all' | 'pending' | 'under_review' | 'approved' | 'action_taken' | 'dismissed'; category: 'all' | 'product' | 'service' | 'chat' | 'user'; search: string; page: number };
  onFiltersChange: (filters: any) => void;
  onViewDetails: (reportId: string) => void;
  onReview: (reportId: string) => void;
  canReview: boolean;
}) {
  const getStatusBadge = (status: ContentReport['status']) => {
    const variants: Record<ContentReport['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      under_review: { variant: 'default', label: 'Under Review' },
      approved: { variant: 'outline', label: 'Approved' },
      action_taken: { variant: 'default', label: 'Action Taken' },
      dismissed: { variant: 'outline', label: 'Dismissed' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryIcon = (category: ContentReport['reportCategory']) => {
    switch (category) {
      case 'product': return <Package className="h-4 w-4" />;
      case 'service': return <Briefcase className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.totalReports}</p>
                </div>
                <Flag className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingReports}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Under Review</p>
                  <p className="text-2xl font-bold">{stats.underReviewReports}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Action Taken</p>
                  <p className="text-2xl font-bold">{stats.actionTakenReports}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dismissed</p>
                  <p className="text-2xl font-bold">{stats.dismissedReports}</p>
                </div>
                <XCircle className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
            className="pl-10"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any, page: 1 })}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="action_taken">Action Taken</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => onFiltersChange({ ...filters, category: e.target.value as any, page: 1 })}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Categories</option>
          <option value="product">Products</option>
          <option value="service">Services</option>
          <option value="chat">Chats</option>
          <option value="user">Users</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getCategoryIcon(report.reportCategory)}
                    <div>
                      <h3 className="font-semibold capitalize">
                        {report.reportCategory} Report - {report.reportType.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Reported by {report.reporterName || 'Unknown'} • {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                    {report.reason}
                  </p>
                  {report.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {report.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(report.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(report.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {canReview && report.status === 'pending' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onReview(report.id)}
                    >
                      Review
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No content reports found
          </div>
        )}
      </div>
    </div>
  );
}

