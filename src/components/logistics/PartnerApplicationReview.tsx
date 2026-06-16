import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logisticsAPI, PartnerApplication } from '@/lib/api/logistics';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PartnerApplicationReviewProps {
  open: boolean;
  onClose: () => void;
  application: PartnerApplication | null;
  onApplicationUpdated: () => void;
}

export const PartnerApplicationReview: React.FC<PartnerApplicationReviewProps> = ({
  open,
  onClose,
  application,
  onApplicationUpdated,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState(application?.adminNotes || '');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleVerify = async () => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      await logisticsAPI.verifyPartnerApplication(application.id, adminNotes || undefined);
      
      toast({
        title: 'Application Verified',
        description: `Partner application for ${application.companyName} has been verified successfully.`,
      });
      
      onApplicationUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to verify application',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!application || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      await logisticsAPI.rejectPartnerApplication(
        application.id,
        rejectionReason,
        adminNotes || undefined
      );
      
      toast({
        title: 'Application Rejected',
        description: `Partner application for ${application.companyName} has been rejected.`,
      });
      
      onApplicationUpdated();
      onClose();
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject application',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'under_review': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      case 'under_review': return 'Under Review';
      default: return 'In Progress';
    }
  };

  if (!application) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Partner Application Review</span>
              <Badge className={getStatusColor(application.status)}>
                {getStatusText(application.status)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                      <p className="font-semibold">{application.companyName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Tracking ID</Label>
                      <p className="font-mono">{application.trackingId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Contact Person</Label>
                      <p>{application.contactPersonName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Contact Email</Label>
                      <p>{application.contactEmail}</p>
                    </div>
                    {application.contactPhone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Contact Phone</Label>
                        <p>{application.contactPhone}</p>
                      </div>
                    )}
                    {application.yearsInOperation && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Years in Operation</Label>
                        <p>{application.yearsInOperation}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Headquarters Address</Label>
                    <p>{application.headquartersAddress}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Fleet Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fleet Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Total Riders</Label>
                      <p>{application.totalRiders || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Average Daily Deliveries</Label>
                      <p>{application.averageDailyDeliveries || 0}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Vehicle Fleet</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(application.vehicleFleet).map(([type, info]) => (
                        <div key={type} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <span className="font-semibold">{info.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {application.serviceAreas.map((area, index) => (
                      <Badge key={index} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.registrationDocumentUrls && application.registrationDocumentUrls.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Registration Documents</Label>
                      <div className="space-y-2 mt-1">
                        {application.registrationDocumentUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            Document {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {application.insuranceDocumentUrls && application.insuranceDocumentUrls.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Insurance Documents</Label>
                      <div className="space-y-2 mt-1">
                        {application.insuranceDocumentUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            Document {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {application.fleetDocumentUrls && application.fleetDocumentUrls.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Fleet Documents</Label>
                      <div className="space-y-2 mt-1">
                        {application.fleetDocumentUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            Document {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>

              {/* Rejection Reason (if rejected) */}
              {application.status === 'rejected' && application.rejectionReason && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Rejection Reason</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600">{application.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {application.status === 'in_progress' && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isSubmitting}
                >
                  Reject
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
