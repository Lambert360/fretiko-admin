'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { getFullAuctionBidHistory, invalidateBid, type FullBidHistoryItem } from '@/lib/api/auctions';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface BidHistoryModalProps {
  auctionId: string;
  auctionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BidHistoryModal({ auctionId, auctionTitle, isOpen, onClose }: BidHistoryModalProps) {
  const [bids, setBids] = useState<FullBidHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [invalidating, setInvalidating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && auctionId) {
      loadBidHistory();
    }
  }, [isOpen, auctionId]);

  const loadBidHistory = async () => {
    setLoading(true);
    try {
      const data = await getFullAuctionBidHistory(auctionId);
      setBids(data);
    } catch (error: any) {
      toast({
        title: 'Failed to load bid history',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateBid = async (bidId: string, bidderName: string) => {
    const reason = prompt(`Enter reason for invalidating bid by ${bidderName}:`);
    if (!reason) return;

    setInvalidating(bidId);
    try {
      const result = await invalidateBid(bidId, reason);
      toast({
        title: 'Bid invalidated successfully',
        description: `New current bid: ₣${result.new_current_bid}`,
      });
      // Reload bid history
      await loadBidHistory();
    } catch (error: any) {
      toast({
        title: 'Failed to invalidate bid',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setInvalidating(null);
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Full Bid History
          </DialogTitle>
          <DialogDescription>
            {auctionTitle} - {bids.length} total bids
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No bids found for this auction
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Total Bids</p>
                <p className="text-2xl font-bold">{bids.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valid Bids</p>
                <p className="text-2xl font-bold text-green-600">
                  {bids.filter(b => b.is_valid).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invalid Bids</p>
                <p className="text-2xl font-bold text-red-600">
                  {bids.filter(b => !b.is_valid).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unique Bidders</p>
                <p className="text-2xl font-bold">
                  {new Set(bids.map(b => b.bidder_id)).size}
                </p>
              </div>
            </div>

            {/* Bid List */}
            <div className="space-y-2">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className={`p-4 border rounded-lg ${
                    !bid.is_valid ? 'bg-red-50 border-red-200' : 'bg-white'
                  } ${bid.is_winning ? 'ring-2 ring-green-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    {/* Left: Bidder Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-lg">
                          {bid.bidder_username}
                          {bid.bidder_is_verified && (
                            <CheckCircle className="inline ml-1 h-4 w-4 text-blue-500" />
                          )}
                        </p>
                        {bid.is_winning && (
                          <Badge variant="default" className="bg-green-600">
                            Winning
                          </Badge>
                        )}
                        {!bid.is_valid && (
                          <Badge variant="destructive">Invalid</Badge>
                        )}
                        {bid.is_proxy_bid && (
                          <Badge variant="secondary">Proxy</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        {bid.bidder_phone && (
                          <div>
                            <span className="text-gray-500">Phone:</span>{' '}
                            <span className="font-medium">{bid.bidder_phone}</span>
                          </div>
                        )}
                        {bid.bidder_location && (
                          <div>
                            <span className="text-gray-500">Location:</span>{' '}
                            <span className="font-medium">{bid.bidder_location}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">IP:</span>{' '}
                          <span className="font-mono text-xs">{bid.ip_address || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Display ID:</span>{' '}
                          <span className="font-mono text-xs">{bid.bidder_display_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>{' '}
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {bid.bidder_bio && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Bio:</span>{' '}
                            <span className="font-medium text-gray-300">{bid.bidder_bio}</span>
                          </div>
                        )}
                      </div>

                      {/* Invalidation Info */}
                      {!bid.is_valid && (
                        <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div className="flex-1 text-sm">
                              <p className="font-semibold text-red-900">
                                Invalidated: {bid.invalidation_reason}
                              </p>
                              <p className="text-red-700 text-xs mt-1">
                                By: {bid.invalidated_by_username || 'Admin'} -{' '}
                                {formatDistanceToNow(new Date(bid.invalidated_at!), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="text-right ml-4">
                      <p className="text-3xl font-bold text-gray-900">
                        ₣{bid.amount.toLocaleString()}
                      </p>
                      {bid.max_bid_amount && bid.bid_type === 'proxy' && (
                        <p className="text-sm text-gray-500">
                          Max: ₣{bid.max_bid_amount.toLocaleString()}
                        </p>
                      )}

                      {bid.is_valid && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-3"
                          disabled={invalidating === bid.id}
                          onClick={() => handleInvalidateBid(bid.id, bid.bidder_username)}
                        >
                          {invalidating === bid.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                              Invalidating...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Invalidate Bid
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

