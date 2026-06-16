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
import { logisticsAPI, RiderVerification } from '@/lib/api/logistics';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RiderVerificationReviewProps {
  open: boolean;
  onClose: () => void;
  verification: RiderVerification | null;
  onVerificationUpdated: () => void;
}

export const RiderVerificationReview: React.FC<RiderVerificationReviewProps> = ({
  open,
  onClose,
  verification,
  onVerificationUpdated,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState(verification?.adminNotes || '');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleVerify = async () => {
    if (!verification) return;

    setIsSubmitting(true);
    try {
      await logisticsAPI.verifyRiderApplication(verification.id, adminNotes || undefined);
      
      toast({
        title: 'Rider Verified',
        description: `Rider verification for ${verification.fullName} has been approved successfully.`,
      });
      
      onVerificationUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to verify rider',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!verification || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      await logisticsAPI.rejectRiderApplication(
        verification.id,
        rejectionReason,
        adminNotes || undefined
      );
      
      toast({
        title: 'Verification Rejected',
        description: `Rider verification for ${verification.fullName} has been rejected.`,
      });
      
      onVerificationUpdated();
      onClose();
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject verification',
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

  if (!verification) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Rider Verification Review</span>
              <Badge className={getStatusColor(verification.status)}>
                {getStatusText(verification.status)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                      <p className="font-semibold">{verification.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">User ID</Label>
                      <p className="font-mono text-sm">{verification.userId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Country</Label>
                      <p>{verification.country}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">State</Label>
                      <p>{verification.state}</p>
                    </div>
                    {verification.city && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-500">City</Label>
                        <p>{verification.city}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Vehicle Type</Label>
                      <p className="capitalize">{verification.vehicleType.replace('_', ' ')}</p>
                    </div>
                    {verification.vehicleMake && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Make</Label>
                        <p>{verification.vehicleMake}</p>
                      </div>
                    )}
                    {verification.vehicleModel && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Model</Label>
                        <p>{verification.vehicleModel}</p>
                      </div>
                    )}
                    {verification.vehicleYear && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Year</Label>
                        <p>{verification.vehicleYear}</p>
                      </div>
                    )}
                    {verification.licensePlate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">License Plate</Label>
                        <p>{verification.licensePlate}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Company Affiliation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Affiliation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verification.companyId ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Company ID</Label>
                        <p className="font-mono text-sm">{verification.companyId}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                        <p>{verification.companyName}</p>
                      </div>
                    </div>
                  ) : verification.companyName ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                      <p>{verification.companyName}</p>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Company Affiliation</Label>
                      <p className="text-gray-500">Independent rider</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Experience */}
              {verification.yearsExperience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Years of Experience</Label>
                        <p>{verification.yearsExperience} years</p>
                      </div>
                      {verification.previousDeliveryCompanies && verification.previousDeliveryCompanies.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Previous Companies</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {verification.previousDeliveryCompanies.map((company, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {company}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verification.driverLicenseUrl && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Driver's License</Label>
                      <a
                        href={verification.driverLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block mt-1"
                      >
                        View Driver's License
                      </a>
                    </div>
                  )}
                  
                  {verification.vehicleRegistrationUrl && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Vehicle Registration</Label>
                      <a
                        href={verification.vehicleRegistrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block mt-1"
                      >
                        View Vehicle Registration
                      </a>
                    </div>
                  )}
                  
                  {verification.insuranceDocumentUrl && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Insurance Document</Label>
                      <a
                        href={verification.insuranceDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block mt-1"
                      >
                        View Insurance Document
                      </a>
                    </div>
                  )}
                  
                  {verification.profilePhotoUrl && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Profile Photo</Label>
                      <div className="mt-1">
                        <img
                          src={verification.profilePhotoUrl}
                          alt="Profile"
                          className="w-24 h-24 rounded-lg object-cover border"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Submitted</span>
                    <span className="text-sm">
                      {format(new Date(verification.createdAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {verification.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Reviewed</span>
                      <span className="text-sm">
                        {format(new Date(verification.reviewedAt), 'MMM dd, yyyy HH:mm')}
                      </span>
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
                    placeholder="Add notes about this verification..."
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>

              {/* Rejection Reason (if rejected) */}
              {verification.status === 'rejected' && verification.rejectionReason && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Rejection Reason</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600">{verification.rejectionReason}</p>
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
            
            {verification.status === 'in_progress' && (
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
            <DialogTitle>Reject Verification</DialogTitle>
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
              {isSubmitting ? 'Rejecting...' : 'Reject Verification'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
