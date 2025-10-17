/**
 * AdminAlerts Page
 *
 * View, filter, and manage system alerts.
 * Acknowledge, resolve, or mark alerts as false alarms.
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminAlerts, useResolveAlert } from '@/hooks/admin/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  Filter,
  Check,
  X,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { openWhatsAppChat, formatAlertForWhatsApp } from '@/lib/whatsapp';
import {
  formatAdminDate,
  formatDateTime,
  getAlertSeverityColor,
  getAlertStatusVariant,
} from '@/lib/admin/utils';
import type { AdminAlert, ResolveAlertInput } from '@/lib/admin/types';

/**
 * Alert Details Dialog
 */
interface AlertDetailsDialogProps {
  alert: AdminAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (status: 'acknowledged' | 'resolved' | 'false_alarm', notes?: string) => void;
}

const AlertDetailsDialog: React.FC<AlertDetailsDialogProps> = ({
  alert,
  open,
  onOpenChange,
  onResolve,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvingStatus, setResolvingStatus] = useState<'acknowledged' | 'resolved' | 'false_alarm' | null>(null);

  if (!alert) return null;

  const handleResolve = (status: 'acknowledged' | 'resolved' | 'false_alarm') => {
    setResolvingStatus(status);
    onResolve(status, resolutionNotes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>Alert Details</DialogTitle>
              <DialogDescription>View and manage alert information</DialogDescription>
            </div>
            <Badge
              variant="outline"
              style={{
                backgroundColor: getAlertSeverityColor(alert.severity),
                color: '#2F4733',
                borderColor: 'transparent',
              }}
            >
              {alert.severity}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert Message */}
          <div>
            <Label className="text-muted-foreground">Alert Message</Label>
            <p className="text-sm font-medium mt-1">{alert.alert_message}</p>
          </div>

          {/* Patient Information */}
          {alert.patient && (
            <div>
              <Label className="text-muted-foreground">Patient</Label>
              <p className="text-sm font-medium mt-1">
                {alert.patient.full_name} ({alert.patient.email})
              </p>
            </div>
          )}

          {/* Alert Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Alert Type</Label>
              <p className="text-sm font-medium mt-1">{alert.alert_type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={getAlertStatusVariant(alert.status)}>{alert.status}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p className="text-sm font-medium mt-1">{formatDateTime(alert.created_at)}</p>
            </div>
            {alert.acknowledged_at && (
              <div>
                <Label className="text-muted-foreground">Acknowledged</Label>
                <p className="text-sm font-medium mt-1">{formatDateTime(alert.acknowledged_at)}</p>
              </div>
            )}
          </div>

          {/* Alert Details JSON */}
          {alert.alert_details && (
            <div>
              <Label className="text-muted-foreground">Additional Details</Label>
              <pre className="text-xs bg-muted p-3 rounded-md mt-1 overflow-x-auto">
                {JSON.stringify(alert.alert_details, null, 2)}
              </pre>
            </div>
          )}

          {/* Notified Caregivers */}
          {alert.notified_caregivers && alert.notified_caregivers.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Notified Caregivers</Label>
              <p className="text-sm mt-1">{alert.notified_caregivers.length} caregiver(s) notified</p>
            </div>
          )}

          {/* Existing Resolution Notes */}
          {alert.resolution_notes && (
            <div>
              <Label className="text-muted-foreground">Resolution Notes</Label>
              <p className="text-sm mt-1">{alert.resolution_notes}</p>
            </div>
          )}

          {/* Resolution Section (for active alerts) */}
          {alert.status === 'active' && (
            <div className="space-y-3 pt-4 border-t">
              <Label htmlFor="resolution_notes">Resolution Notes (Optional)</Label>
              <Textarea
                id="resolution_notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add notes about the resolution..."
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleResolve('acknowledged')}
                  variant="outline"
                  disabled={!!resolvingStatus}
                >
                  <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                  Acknowledge
                </Button>
                <Button
                  onClick={() => handleResolve('resolved')}
                  disabled={!!resolvingStatus}
                >
                  <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                  Resolve
                </Button>
                <Button
                  onClick={() => handleResolve('false_alarm')}
                  variant="outline"
                  disabled={!!resolvingStatus}
                >
                  <X className="h-4 w-4 mr-2" aria-hidden="true" />
                  False Alarm
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {alert.patient && (alert.patient as any).phone_number && (
            <Button
              variant="outline"
              onClick={() => {
                const message = formatAlertForWhatsApp(alert);
                openWhatsAppChat((alert.patient as any).phone_number, message);
              }}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Share via WhatsApp
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * AdminAlerts Page Component
 */
export const AdminAlerts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'active');
  const [selectedAlert, setSelectedAlert] = useState<AdminAlert | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: alerts, isLoading, error } = useAdminAlerts({
    severity: severityFilter !== 'all' ? (severityFilter as any) : undefined,
    status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const resolveMutation = useResolveAlert(selectedAlert?.id || '');
  const { toast } = useToast();

  const handleViewDetails = (alert: AdminAlert) => {
    setSelectedAlert(alert);
    setDetailsDialogOpen(true);
  };

  const handleResolveAlert = async (
    status: 'acknowledged' | 'resolved' | 'false_alarm',
    notes?: string
  ) => {
    try {
      await resolveMutation.mutateAsync({
        status,
        resolution_notes: notes,
      });

      toast({
        title: 'Alert updated',
        description: `Alert has been marked as ${status}.`,
      });

      setDetailsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update alert',
        variant: 'destructive',
      });
    }
  };

  const criticalCount = alerts?.filter((a) => a.severity === 'critical' && a.status === 'active').length || 0;
  const highCount = alerts?.filter((a) => a.severity === 'high' && a.status === 'active').length || 0;

  return (
    <AdminLayout
      title="Alert Management"
      description="View and manage system alerts"
      breadcrumbs={[{ label: 'Alerts' }]}
    >
      <div className="space-y-6">
        {/* Alert Summary */}
        {(criticalCount > 0 || highCount > 0) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              {criticalCount > 0 && `${criticalCount} critical alert${criticalCount !== 1 ? 's' : ''}`}
              {criticalCount > 0 && highCount > 0 && ' and '}
              {highCount > 0 && `${highCount} high-priority alert${highCount !== 1 ? 's' : ''}`}
              {' require immediate attention'}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-4 flex-1">
            <p className="text-sm text-muted-foreground">
              {alerts ? `${alerts.length} alert${alerts.length !== 1 ? 's' : ''} found` : 'Loading...'}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_alarm">False Alarm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>Failed to load alerts. Please try again.</AlertDescription>
          </Alert>
        )}

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>View and manage all system alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewDetails(alert)}
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: getAlertSeverityColor(alert.severity),
                              color: '#2F4733',
                              borderColor: 'transparent',
                            }}
                          >
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium max-w-md truncate" style={{ color: '#2F4733' }}>
                            {alert.alert_message}
                          </p>
                        </TableCell>
                        <TableCell>
                          {alert.patient ? (
                            <div>
                              <p className="text-sm font-medium">{alert.patient.full_name}</p>
                              <p className="text-xs text-muted-foreground">{alert.patient.email}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.alert_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getAlertStatusVariant(alert.status)}>{alert.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatAdminDate(alert.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(alert);
                              }}
                            >
                              <FileText className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">View details</span>
                            </Button>
                            {alert.patient && (alert.patient as any).phone_number && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const message = formatAlertForWhatsApp(alert);
                                  openWhatsAppChat((alert.patient as any).phone_number, message);
                                }}
                                title="Share via WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                <span className="sr-only">Share via WhatsApp</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-lg font-medium mb-2">No alerts found</p>
                <p className="text-sm text-muted-foreground">
                  {severityFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'All clear - no alerts to display'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Details Dialog */}
      <AlertDetailsDialog
        alert={selectedAlert}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onResolve={handleResolveAlert}
      />
    </AdminLayout>
  );
};

export default AdminAlerts;
