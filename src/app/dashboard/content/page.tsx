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
  File,
  Music,
  Download,
} from 'lucide-react';

type TabType = 'products' | 'services' | 'stories' | 'live-streams' | 'auctions' | 'reported';

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
  const [reportedContent, setReportedContent] = useState<any[]>([]);
  const [reportedContentStats, setReportedContentStats] = useState<any>(null);

  // Filters
  const [productFilters, setProductFilters] = useState({ status: 'all', search: '', page: 1 });
  const [serviceFilters, setServiceFilters] = useState({ status: 'all', search: '', page: 1 });
  const [storyFilters, setStoryFilters] = useState({ search: '', page: 1 });
  const [streamFilters, setStreamFilters] = useState({ status: 'all', page: 1 });
  const [auctionFilters, setAuctionFilters] = useState({ status: 'all', search: '', page: 1 });
  const [reportedFilters, setReportedFilters] = useState({ status: 'all' as 'all' | 'pending' | 'under_review' | 'approved' | 'action_taken' | 'dismissed', category: 'all' as 'all' | 'product' | 'service' | 'chat' | 'user', search: '', page: 1 });

  // Moderation dialogs
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; type: string; id: string }>({ open: false, type: '', id: '' });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; type: string; id: string }>({ open: false, type: '', id: '' });
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reported content review dialog
  const [reviewReportDialog, setReviewReportDialog] = useState<{ open: boolean; report: any | null }>({ open: false, report: null });
  const [reviewAction, setReviewAction] = useState<'approved' | 'action_taken' | 'dismissed'>('approved');
  const [reviewActionTaken, setReviewActionTaken] = useState<'no_action' | 'content_removed' | 'user_warned' | 'user_suspended'>('no_action');
  const [reviewReason, setReviewReason] = useState('');
  
  // Reported content viewer dialog
  const [viewContentDialog, setViewContentDialog] = useState<{ open: boolean; content: Product | Service | null; type: 'product' | 'service' | null }>({ open: false, content: null, type: null });
  const [isLoadingReportedContent, setIsLoadingReportedContent] = useState(false);
  
  // Evidence viewer dialog
  const [evidenceViewer, setEvidenceViewer] = useState<{
    open: boolean;
    evidence: Array<{ type: string; url: string; description?: string }>;
    currentIndex: number;
  }>({ open: false, evidence: [], currentIndex: 0 });

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
      fetchContent();
    }
  }, [activeTab, productFilters, serviceFilters, storyFilters, streamFilters, auctionFilters, reportedFilters]);

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
        case 'reported':
          if (canViewProducts) {
            const reportedData = await contentAPI.getReportedContent({
              status: reportedFilters.status !== 'all' ? reportedFilters.status : undefined,
              category: reportedFilters.category !== 'all' ? reportedFilters.category : undefined,
              search: reportedFilters.search || undefined,
              page: reportedFilters.page,
              limit: 20,
            });
            setReportedContent(reportedData.reports || []);
            
            // Fetch stats
            const stats = await contentAPI.getReportedContentStats();
            setReportedContentStats(stats);
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
              onClick={() => setActiveTab('reported')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reported'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reported Content
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

          {/* Reported Content Tab */}
          {activeTab === 'reported' && canViewProducts && (
            <div className="space-y-4">
              {/* Stats Cards */}
              {reportedContentStats && (
                <div className="grid gap-4 md:grid-cols-5">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Reports</p>
                        <p className="text-2xl font-bold">{reportedContentStats.totalReports || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{reportedContentStats.pendingReports || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Under Review</p>
                        <p className="text-2xl font-bold text-blue-600">{reportedContentStats.underReviewReports || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Action Taken</p>
                        <p className="text-2xl font-bold text-green-600">{reportedContentStats.actionTakenReports || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Dismissed</p>
                        <p className="text-2xl font-bold text-gray-600">{reportedContentStats.dismissedReports || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filters and Reports List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Reported Content</CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search reports..."
                          value={reportedFilters.search}
                          onChange={(e) => setReportedFilters({ ...reportedFilters, search: e.target.value })}
                          className="pl-10 w-[200px]"
                        />
                      </div>
                      <select
                        value={reportedFilters.status}
                        onChange={(e) => setReportedFilters({ ...reportedFilters, status: e.target.value as any })}
                        className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="action_taken">Action Taken</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                      <select
                        value={reportedFilters.category}
                        onChange={(e) => setReportedFilters({ ...reportedFilters, category: e.target.value as any })}
                        className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        <option value="all">All Categories</option>
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                        <option value="chat">Chat</option>
                        <option value="user">User</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportedContent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Reported Content</h3>
                      <p className="text-muted-foreground">
                        {reportedFilters.status !== 'all' || reportedFilters.category !== 'all' || reportedFilters.search
                          ? 'No reports match your filters'
                          : 'No content has been reported yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reportedContent.map((report) => (
                        <Card key={report.id} className="border-l-4 border-l-yellow-500">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="capitalize">{report.reportCategory}</Badge>
                                  <Badge className={
                                    report.status === 'pending' ? 'bg-yellow-500' :
                                    report.status === 'under_review' ? 'bg-blue-500' :
                                    report.status === 'action_taken' ? 'bg-green-500' :
                                    'bg-gray-500'
                                  }>
                                    {report.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant="secondary" className="capitalize">{report.reportType.replace(/_/g, ' ')}</Badge>
                                </div>
                                <p className="font-medium mb-1">{report.reason}</p>
                                {report.description && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{report.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                  <span>Reported: {new Date(report.createdAt).toLocaleDateString()}</span>
                                  {report.moderatedAt && (
                                    <span>Reviewed: {new Date(report.moderatedAt).toLocaleDateString()}</span>
                                  )}
                                </div>
                                {(report.productId || report.serviceId || report.chatId || report.reportedUserId) && (
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {report.productId && <span className="mr-3">Product: {report.productId.substring(0, 8)}...</span>}
                                    {report.serviceId && <span className="mr-3">Service: {report.serviceId.substring(0, 8)}...</span>}
                                    {report.chatId && <span className="mr-3">Chat: {report.chatId.substring(0, 8)}...</span>}
                                    {report.reportedUserId && <span>User: {report.reportedUserId.substring(0, 8)}...</span>}
                                  </div>
                                )}
                                {report.evidence && report.evidence.length > 0 && (
                                  <div 
                                    className="mt-2 text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => setEvidenceViewer({ 
                                      open: true, 
                                      evidence: report.evidence, 
                                      currentIndex: 0 
                                    })}
                                    title="Click to view evidence"
                                  >
                                    <span className="font-medium">Evidence: </span>
                                    <span className="underline">{report.evidence.length} file(s) attached - Click to view</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setReviewReportDialog({ open: true, report })}
                                  disabled={report.status === 'dismissed' || report.status === 'action_taken'}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {report.status === 'pending' || report.status === 'under_review' ? 'Review' : 'View'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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

      {/* Media Viewer Dialog */}
      <Dialog open={mediaViewer.open} onOpenChange={(open) => setMediaViewer({ ...mediaViewer, open })} zIndex={60}>
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

      {/* Review Reported Content Dialog */}
      <Dialog open={reviewReportDialog.open} onOpenChange={(open) => {
        if (!open) {
          setReviewReportDialog({ open: false, report: null });
          setReviewAction('approved');
          setReviewActionTaken('no_action');
          setReviewReason('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={() => {
            setReviewReportDialog({ open: false, report: null });
            setReviewAction('approved');
            setReviewActionTaken('no_action');
            setReviewReason('');
          }} />
          <DialogHeader>
            <DialogTitle>Review Content Report</DialogTitle>
            <DialogDescription>
              Review and take action on this reported content
            </DialogDescription>
          </DialogHeader>
          {reviewReportDialog.report && (
            <div className="space-y-4">
              {/* Report Details */}
              <div className="space-y-2 p-4 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{reviewReportDialog.report.reportCategory}</Badge>
                  <Badge className={
                    reviewReportDialog.report.status === 'pending' ? 'bg-yellow-500' :
                    reviewReportDialog.report.status === 'under_review' ? 'bg-blue-500' :
                    reviewReportDialog.report.status === 'action_taken' ? 'bg-green-500' :
                    'bg-gray-500'
                  }>
                    {reviewReportDialog.report.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">{reviewReportDialog.report.reportType.replace(/_/g, ' ')}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Reason</p>
                  <p className="text-sm">{reviewReportDialog.report.reason}</p>
                </div>
                {reviewReportDialog.report.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{reviewReportDialog.report.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium">Reported Content</p>
                    {reviewReportDialog.report.productId && <p>Product: {reviewReportDialog.report.productId.substring(0, 8)}...</p>}
                    {reviewReportDialog.report.serviceId && <p>Service: {reviewReportDialog.report.serviceId.substring(0, 8)}...</p>}
                    {reviewReportDialog.report.chatId && <p>Chat: {reviewReportDialog.report.chatId.substring(0, 8)}...</p>}
                    {reviewReportDialog.report.reportedUserId && <p>User: {reviewReportDialog.report.reportedUserId.substring(0, 8)}...</p>}
                  </div>
                  <div>
                    <p className="font-medium">Timeline</p>
                    <p>Reported: {new Date(reviewReportDialog.report.createdAt).toLocaleString()}</p>
                    {reviewReportDialog.report.moderatedAt && (
                      <p>Reviewed: {new Date(reviewReportDialog.report.moderatedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                {reviewReportDialog.report.evidence && reviewReportDialog.report.evidence.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Evidence ({reviewReportDialog.report.evidence.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {reviewReportDialog.report.evidence.map((evidence: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="border rounded-md p-2 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => setEvidenceViewer({ 
                            open: true, 
                            evidence: reviewReportDialog.report.evidence, 
                            currentIndex: idx 
                          })}
                        >
                          {evidence.type === 'image' ? (
                            <img 
                              src={evidence.url} 
                              alt={evidence.description || `Evidence ${idx + 1}`} 
                              className="w-full h-24 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ccc"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EBroken Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : evidence.type === 'video' ? (
                            <div className="relative w-full h-24 bg-black rounded flex items-center justify-center">
                              <Video className="h-8 w-8 text-white" />
                              <span className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">Video</span>
                            </div>
                          ) : evidence.type === 'audio' ? (
                            <div className="flex items-center justify-center h-24 bg-muted rounded">
                              <Music className="h-8 w-8 text-muted-foreground" />
                              <span className="ml-2 text-xs text-muted-foreground">Audio</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 h-24">
                              <File className="h-6 w-6 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">
                                {evidence.description || 'Document'}
                              </span>
                            </div>
                          )}
                          {evidence.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate" title={evidence.description}>
                              {evidence.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {reviewReportDialog.report.actionTaken && (
                  <div className="p-2 bg-background rounded border">
                    <p className="text-sm font-medium mb-1">Previous Action</p>
                    <p className="text-xs text-muted-foreground capitalize">{reviewReportDialog.report.actionTaken.replace(/_/g, ' ')}</p>
                    {reviewReportDialog.report.actionReason && (
                      <p className="text-xs text-muted-foreground mt-1">{reviewReportDialog.report.actionReason}</p>
                    )}
                  </div>
                )}
              </div>

              {/* View Reported Content Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const report = reviewReportDialog.report;
                    if (report?.productId) {
                      try {
                        setIsLoadingReportedContent(true);
                        console.log('[View Reported Content] Product ID from report:', report.productId);
                        console.log('[View Reported Content] Full report object:', report);
                        console.log('[View Reported Content] Calling getProductById with:', report.productId);
                        
                        const product = await contentAPI.getProductById(report.productId);
                        
                        console.log('[View Reported Content] Product fetched:', product);
                        
                        if (product) {
                          console.log('[View Reported Content] Product found, opening dialog');
                          setViewContentDialog({ open: true, content: product, type: 'product' });
                        } else {
                          console.warn('[View Reported Content] Product is null/undefined');
                          toast({
                            title: 'Product Not Found',
                            description: `The reported product (ID: ${report.productId.substring(0, 8)}...) could not be found. It may have been deleted or is not accessible.`,
                            variant: 'destructive',
                          });
                        }
                      } catch (err: any) {
                        console.error('[View Reported Content] Error fetching product:', err);
                        console.error('[View Reported Content] Error details:', {
                          message: err?.message,
                          response: err?.response?.data,
                          status: err?.response?.status,
                          statusText: err?.response?.statusText,
                          productId: report.productId,
                        });
                        const errorMessage = err?.message || err?.response?.data?.message || 'Failed to fetch product details. Please check the browser console for more details.';
                        toast({
                          title: 'Error',
                          description: `${errorMessage} (Product ID: ${report.productId.substring(0, 8)}...)`,
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoadingReportedContent(false);
                      }
                    } else if (report?.serviceId) {
                      try {
                        setIsLoadingReportedContent(true);
                        console.log('[View Reported Content] Service ID from report:', report.serviceId);
                        console.log('[View Reported Content] Full report object:', report);
                        console.log('[View Reported Content] Calling getServiceById with:', report.serviceId);
                        
                        const service = await contentAPI.getServiceById(report.serviceId);
                        
                        console.log('[View Reported Content] Service fetched:', service);
                        
                        if (service) {
                          console.log('[View Reported Content] Service found, opening dialog');
                          setViewContentDialog({ open: true, content: service, type: 'service' });
                        } else {
                          console.warn('[View Reported Content] Service is null/undefined');
                          toast({
                            title: 'Service Not Found',
                            description: `The reported service (ID: ${report.serviceId.substring(0, 8)}...) could not be found. It may have been deleted or is not accessible.`,
                            variant: 'destructive',
                          });
                        }
                      } catch (err: any) {
                        console.error('[View Reported Content] Error fetching service:', err);
                        console.error('[View Reported Content] Error details:', {
                          message: err?.message,
                          response: err?.response?.data,
                          status: err?.response?.status,
                          statusText: err?.response?.statusText,
                          serviceId: report.serviceId,
                        });
                        const errorMessage = err?.message || err?.response?.data?.message || 'Failed to fetch service details. Please check the browser console for more details.';
                        toast({
                          title: 'Error',
                          description: `${errorMessage} (Service ID: ${report.serviceId.substring(0, 8)}...)`,
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoadingReportedContent(false);
                      }
                    } else if (report?.chatId) {
                      toast({
                        title: 'Chat Content',
                        description: 'Chat moderation is not available in this view. Chat ID: ' + report.chatId.substring(0, 8) + '...',
                      });
                    } else if (report?.reportedUserId) {
                      toast({
                        title: 'User Profile',
                        description: 'User profile view is not available in content moderation. User ID: ' + report.reportedUserId.substring(0, 8) + '...',
                      });
                    }
                  }}
                  disabled={isLoadingReportedContent}
                >
                  {isLoadingReportedContent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      View Reported Content
                    </>
                  )}
                </Button>
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="review-action">Review Decision *</Label>
                  <select
                    id="review-action"
                    value={reviewAction}
                    onChange={(e) => {
                      setReviewAction(e.target.value as any);
                      if (e.target.value !== 'action_taken') {
                        setReviewActionTaken('no_action');
                      }
                    }}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm mt-2"
                  >
                    <option value="approved">Approve Report</option>
                    <option value="action_taken">Take Action</option>
                    <option value="dismissed">Dismiss Report</option>
                  </select>
                </div>

                {reviewAction === 'action_taken' && (
                  <div>
                    <Label htmlFor="action-taken">Action Taken *</Label>
                    <select
                      id="action-taken"
                      value={reviewActionTaken}
                      onChange={(e) => setReviewActionTaken(e.target.value as any)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm mt-2"
                    >
                      <option value="no_action">No Action</option>
                      <option value="content_removed">Content Removed (Reject)</option>
                      <option value="user_warned">User Warned</option>
                      <option value="user_suspended">User Suspended</option>
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="review-reason">Action Reason *</Label>
                  <Textarea
                    id="review-reason"
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="Explain the action taken or reason for dismissal..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewReportDialog({ open: false, report: null });
                setReviewAction('approved');
                setReviewActionTaken('no_action');
                setReviewReason('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!reviewReportDialog.report || !reviewReason.trim()) {
                  toast({
                    title: 'Validation Error',
                    description: 'Please provide a reason for your review decision',
                    variant: 'destructive',
                  });
                  return;
                }

                try {
                  setIsSubmitting(true);
                  await contentAPI.reviewReportedContent(reviewReportDialog.report.id, {
                    status: reviewAction,
                    actionTaken: reviewAction === 'action_taken' ? reviewActionTaken : undefined,
                    actionReason: reviewReason,
                  });
                  
                  setReviewReportDialog({ open: false, report: null });
                  setReviewAction('approved');
                  setReviewActionTaken('no_action');
                  setReviewReason('');
                  
                  await fetchContent();
                  if (activeTab === 'reported') {
                    const stats = await contentAPI.getReportedContentStats();
                    setReportedContentStats(stats);
                  }
                  
                  toast({
                    title: 'Success',
                    description: 'Report reviewed successfully',
                  });
                } catch (err: any) {
                  console.error('Failed to review report:', err);
                  toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to review report',
                    variant: 'destructive',
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting || !reviewReason.trim()}
            >
              {isSubmitting ? 'Reviewing...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Reported Content Dialog */}
      <Dialog open={viewContentDialog.open} onOpenChange={(open) => setViewContentDialog({ open, content: null, type: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={() => setViewContentDialog({ open: false, content: null, type: null })} />
          <DialogHeader>
            <DialogTitle>
              {viewContentDialog.type === 'product' ? 'Product Details' : viewContentDialog.type === 'service' ? 'Service Details' : 'Content Details'}
            </DialogTitle>
            <DialogDescription>
              View the reported {viewContentDialog.type === 'product' ? 'product' : viewContentDialog.type === 'service' ? 'service' : 'content'} details
            </DialogDescription>
          </DialogHeader>
          {viewContentDialog.content && (
            <div className="space-y-4">
              {viewContentDialog.type === 'product' && (
                <>
                  {(() => {
                    const product = viewContentDialog.content as Product;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          {(product.primary_image_url || product.primary_video_url) && (
                            <div>
                              {product.media_type === 'video' && product.primary_video_url ? (
                                <video
                                  src={product.primary_video_url}
                                  className="w-full h-64 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                  controls
                                  onClick={() => {
                                    const allMedia = Array.from(new Set([
                                      product.primary_video_url,
                                      ...(product.videos || []),
                                      ...(product.images || []),
                                      product.primary_image_url
                                    ])).filter((url): url is string => Boolean(url));
                                    const mappedMedia = allMedia.map(m => {
                                      const isVideo = (product.primary_video_url === m && product.media_type === 'video') ||
                                        (product.videos || []).includes(m);
                                      return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                                    });
                                    const currentIdx = allMedia.findIndex(m => m === product.primary_video_url);
                                    setMediaViewer({
                                      open: true,
                                      type: 'video',
                                      url: product.primary_video_url!,
                                      allMedia: mappedMedia,
                                      currentIndex: currentIdx >= 0 ? currentIdx : 0,
                                    });
                                  }}
                                />
                              ) : product.primary_image_url ? (
                                <img
                                  src={product.primary_image_url}
                                  alt={product.name}
                                  className="w-full h-64 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    const allMedia = Array.from(new Set([
                                      product.primary_image_url,
                                      ...(product.images || []),
                                      product.primary_video_url,
                                      ...(product.videos || [])
                                    ])).filter((url): url is string => Boolean(url));
                                    const mappedMedia = allMedia.map(m => {
                                      const isVideo = (product.primary_video_url === m && product.media_type === 'video') ||
                                        (product.videos || []).includes(m);
                                      return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                                    });
                                    const currentIdx = allMedia.findIndex(m => m === product.primary_image_url);
                                    setMediaViewer({
                                      open: true,
                                      type: 'image',
                                      url: product.primary_image_url!,
                                      allMedia: mappedMedia,
                                      currentIndex: currentIdx >= 0 ? currentIdx : 0,
                                    });
                                  }}
                                />
                              ) : null}
                            </div>
                          )}
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Name</p>
                              <p className="text-lg font-semibold">{product.name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Price</p>
                              <p className="text-lg">₦{product.price.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                              <p>{product.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Status</p>
                              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                {product.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Owner</p>
                              <p>{product.user?.preferences?.fullName || product.user?.full_name || product.user?.username || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                          <p className="text-sm">{product.description}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Views</p>
                            <p className="font-semibold">{product.view_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Likes</p>
                            <p className="font-semibold">{product.like_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p className="font-semibold">{new Date(product.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {product.images && product.images.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Additional Images</p>
                            <div className="grid grid-cols-4 gap-2">
                              {product.images.map((img, idx) => {
                                const allMedia = Array.from(new Set([
                                  product.primary_image_url,
                                  ...(product.images || []),
                                  product.primary_video_url,
                                  ...(product.videos || [])
                                ])).filter((url): url is string => Boolean(url));
                                const mappedMedia = allMedia.map(m => {
                                  const isVideo = (product.primary_video_url === m && product.media_type === 'video') ||
                                    (product.videos || []).includes(m);
                                  return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                                });
                                const currentIdx = allMedia.findIndex(m => m === img);
                                return (
                                  <img 
                                    key={idx} 
                                    src={img} 
                                    alt={`${product.name} ${idx + 1}`} 
                                    className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                      setMediaViewer({
                                        open: true,
                                        type: 'image',
                                        url: img,
                                        allMedia: mappedMedia,
                                        currentIndex: currentIdx >= 0 ? currentIdx : 0,
                                      });
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {product.videos && product.videos.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Additional Videos</p>
                            <div className="grid grid-cols-2 gap-2">
                              {product.videos.map((vid, idx) => {
                                const allMedia = Array.from(new Set([
                                  product.primary_video_url,
                                  ...(product.videos || []),
                                  product.primary_image_url,
                                  ...(product.images || [])
                                ])).filter((url): url is string => Boolean(url));
                                const mappedMedia = allMedia.map(m => {
                                  const isVideo = (product.primary_video_url === m && product.media_type === 'video') ||
                                    (product.videos || []).includes(m);
                                  return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                                });
                                const currentIdx = allMedia.findIndex(m => m === vid);
                                return (
                                  <video 
                                    key={idx} 
                                    src={vid} 
                                    className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity" 
                                    controls
                                    onClick={() => {
                                      setMediaViewer({
                                        open: true,
                                        type: 'video',
                                        url: vid,
                                        allMedia: mappedMedia,
                                        currentIndex: currentIdx >= 0 ? currentIdx : 0,
                                      });
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
              {viewContentDialog.type === 'service' && (
                <>
                  {(() => {
                    const service = viewContentDialog.content as Service;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          {service.primary_media_url && (
                            <div>
                              {service.media_type === 'video' ? (
                                <video
                                  src={service.primary_media_url}
                                  className="w-full h-64 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                  controls
                                  onClick={() => {
                                    const allMedia = Array.from(new Set([
                                      service.primary_media_url,
                                      ...(service.videos || []),
                                      ...(service.images || [])
                                    ])).filter((url): url is string => Boolean(url));
                                    const mappedMedia = allMedia.map(m => {
                                      const isVideo = (service.primary_media_url === m && service.media_type === 'video') ||
                                        (service.videos || []).includes(m);
                                      return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                                    });
                                    const currentIdx = allMedia.findIndex(m => m === service.primary_media_url);
                                    setMediaViewer({
                                      open: true,
                                      type: 'video',
                                      url: service.primary_media_url!,
                                      allMedia: mappedMedia,
                                      currentIndex: currentIdx >= 0 ? currentIdx : 0,
                                    });
                                  }}
                                />
                              ) : (
                                <img
                                  src={service.primary_media_url}
                                  alt={service.name}
                                  className="w-full h-64 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    const allMedia = Array.from(new Set([
                                      service.primary_media_url,
                                      ...(service.images || []),
                                      ...(service.videos || [])
                                    ])).filter((url): url is string => Boolean(url));
                                    const mappedMedia = allMedia.map(m => {
                                      const isVideo = (service.primary_media_url === m && service.media_type === 'video') ||
                                        (service.videos || []).includes(m);
                                      return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                                    });
                                    const currentIdx = allMedia.findIndex(m => m === service.primary_media_url);
                                    setMediaViewer({
                                      open: true,
                                      type: 'image',
                                      url: service.primary_media_url!,
                                      allMedia: mappedMedia,
                                      currentIndex: currentIdx >= 0 ? currentIdx : 0,
                                    });
                                  }}
                                />
                              )}
                            </div>
                          )}
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Name</p>
                              <p className="text-lg font-semibold">{service.name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Base Price</p>
                              <p className="text-lg">₦{service.base_price.toLocaleString()}</p>
                            </div>
                            {service.duration && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                                <p>{service.duration}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Status</p>
                              <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                                {service.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Owner</p>
                              <p>{service.user?.preferences?.fullName || service.user?.full_name || service.user?.username || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                          <p className="text-sm">{service.description}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Views</p>
                            <p className="font-semibold">{service.view_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Likes</p>
                            <p className="font-semibold">{service.like_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Bookings</p>
                            <p className="font-semibold">{service.booking_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p className="font-semibold">{new Date(service.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {service.images && service.images.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Additional Images</p>
                            <div className="grid grid-cols-4 gap-2">
                              {service.images.map((img, idx) => {
                                const allMedia = Array.from(new Set([
                                  service.primary_media_url,
                                  ...(service.images || []),
                                  ...(service.videos || [])
                                ])).filter((url): url is string => Boolean(url));
                                const mappedMedia = allMedia.map(m => {
                                  const isVideo = (service.primary_media_url === m && service.media_type === 'video') ||
                                    (service.videos || []).includes(m);
                                  return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                                });
                                const currentIdx = allMedia.findIndex(m => m === img);
                                return (
                                  <img 
                                    key={idx} 
                                    src={img} 
                                    alt={`${service.name} ${idx + 1}`} 
                                    className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                      setMediaViewer({
                                        open: true,
                                        type: 'image',
                                        url: img,
                                        allMedia: mappedMedia,
                                        currentIndex: currentIdx >= 0 ? currentIdx : 0,
                                      });
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {service.videos && service.videos.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Additional Videos</p>
                            <div className="grid grid-cols-2 gap-2">
                              {service.videos.map((vid, idx) => {
                                const allMedia = Array.from(new Set([
                                  service.primary_media_url,
                                  ...(service.videos || []),
                                  ...(service.images || [])
                                ])).filter((url): url is string => Boolean(url));
                                const mappedMedia = allMedia.map(m => {
                                  const isVideo = (service.primary_media_url === m && service.media_type === 'video') ||
                                    (service.videos || []).includes(m);
                                  return { url: m, type: (isVideo ? 'video' : 'image') as 'image' | 'video' };
                                });
                                const currentIdx = allMedia.findIndex(m => m === vid);
                                return (
                                  <video 
                                    key={idx} 
                                    src={vid} 
                                    className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity" 
                                    controls
                                    onClick={() => {
                                      setMediaViewer({
                                        open: true,
                                        type: 'video',
                                        url: vid,
                                        allMedia: mappedMedia,
                                        currentIndex: currentIdx >= 0 ? currentIdx : 0,
                                      });
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Evidence Viewer Dialog */}
      <Dialog open={evidenceViewer.open} onOpenChange={(open) => setEvidenceViewer({ open, evidence: [], currentIndex: 0 })} zIndex={60}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setEvidenceViewer({ open: false, evidence: [], currentIndex: 0 })}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {evidenceViewer.evidence && evidenceViewer.evidence.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                  onClick={() => {
                    setEvidenceViewer(prev => {
                      if (!prev.evidence || prev.evidence.length <= 1) return prev;
                      const currentIdx = prev.currentIndex ?? 0;
                      const prevIdx = currentIdx > 0 ? currentIdx - 1 : prev.evidence.length - 1;
                      return {
                        ...prev,
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
                    setEvidenceViewer(prev => {
                      if (!prev.evidence || prev.evidence.length <= 1) return prev;
                      const currentIdx = prev.currentIndex ?? 0;
                      const nextIdx = currentIdx < prev.evidence.length - 1 ? currentIdx + 1 : 0;
                      return {
                        ...prev,
                        currentIndex: nextIdx,
                      };
                    });
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 px-3 py-1 rounded-md text-sm">
                  {(evidenceViewer.currentIndex ?? 0) + 1} / {evidenceViewer.evidence.length}
                </div>
              </>
            )}

            <div className="flex flex-col items-center justify-center min-h-[60vh] max-h-[85vh] p-4">
              {evidenceViewer.evidence && evidenceViewer.evidence.length > 0 && (() => {
                const currentEvidence = evidenceViewer.evidence[evidenceViewer.currentIndex ?? 0];
                if (!currentEvidence) return null;

                return (
                  <div className="w-full space-y-4">
                    {/* Evidence Description */}
                    {currentEvidence.description && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{currentEvidence.description}</p>
                      </div>
                    )}

                    {/* Evidence Content */}
                    <div className="flex items-center justify-center">
                      {currentEvidence.type === 'image' ? (
                        <img
                          src={currentEvidence.url}
                          alt={currentEvidence.description || 'Evidence'}
                          className="max-w-full max-h-[75vh] object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23ccc"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3EImage Not Available%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : currentEvidence.type === 'video' ? (
                        <video
                          src={currentEvidence.url}
                          controls
                          autoPlay
                          className="max-w-full max-h-[75vh] rounded-lg"
                          onError={(e) => {
                            console.error('Video load error:', e);
                            (e.target as HTMLVideoElement).style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'text-center p-8 text-muted-foreground';
                            errorDiv.textContent = 'Video not available';
                            (e.target as HTMLVideoElement).parentElement?.appendChild(errorDiv);
                          }}
                        />
                      ) : currentEvidence.type === 'audio' ? (
                        <div className="w-full max-w-2xl space-y-4">
                          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                            <Music className="h-16 w-16 text-muted-foreground" />
                          </div>
                          <audio
                            src={currentEvidence.url}
                            controls
                            autoPlay
                            className="w-full"
                            onError={(e) => {
                              console.error('Audio load error:', e);
                              (e.target as HTMLAudioElement).style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'text-center p-4 text-destructive';
                              errorDiv.textContent = 'Audio file not available';
                              (e.target as HTMLAudioElement).parentElement?.appendChild(errorDiv);
                            }}
                          />
                          {currentEvidence.description && (
                            <p className="text-sm text-center text-muted-foreground">
                              {currentEvidence.description}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="w-full max-w-2xl space-y-4">
                          <div className="flex flex-col items-center justify-center p-12 bg-muted rounded-lg">
                            <File className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium mb-2">
                              {currentEvidence.description || 'Document'}
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => window.open(currentEvidence.url, '_blank')}
                              className="mt-2"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Document
                            </Button>
                          </div>
                          {currentEvidence.description && (
                            <p className="text-sm text-center text-muted-foreground">
                              {currentEvidence.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Evidence Type Badge */}
                    <div className="flex justify-center">
                      <Badge variant="outline" className="capitalize">
                        {currentEvidence.type}
                      </Badge>
                    </div>
                  </div>
                );
              })()}
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

