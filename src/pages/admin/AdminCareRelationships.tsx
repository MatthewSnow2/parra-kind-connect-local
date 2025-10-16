/**
 * AdminCareRelationships Page
 *
 * Manage care relationships between patients and caregivers.
 * Create, edit, approve, and view relationship details.
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  useAdminRelationships,
  useAdminUsers,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
} from '@/hooks/admin/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Link as LinkIcon,
  AlertCircle,
  Edit,
  Check,
  X,
  Filter,
  Trash2,
} from 'lucide-react';
import {
  formatAdminDate,
  getRelationshipStatusColor,
  formatRole,
} from '@/lib/admin/utils';
import { createRelationshipSchema, updateRelationshipSchema } from '@/lib/admin/validation';
import type { CreateRelationshipInput, UpdateRelationshipInput, AdminCareRelationship } from '@/lib/admin/types';

/**
 * Relationship Dialog Component
 */
interface RelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship?: AdminCareRelationship | null;
  mode: 'create' | 'edit';
}

const RelationshipDialog: React.FC<RelationshipDialogProps> = ({
  open,
  onOpenChange,
  relationship,
  mode,
}) => {
  const { toast } = useToast();
  const createMutation = useCreateRelationship();
  const updateMutation = useUpdateRelationship(relationship?.id || '');
  const { data: users } = useAdminUsers();

  const [formData, setFormData] = useState<Partial<CreateRelationshipInput>>({
    patient_id: relationship?.patient_id || '',
    caregiver_id: relationship?.caregiver_id || '',
    relationship_type: relationship?.relationship_type || 'primary_caregiver',
    relationship_label: relationship?.relationship_label || '',
    can_view_health_data: relationship?.can_view_health_data ?? true,
    can_receive_alerts: relationship?.can_receive_alerts ?? true,
    can_modify_settings: relationship?.can_modify_settings ?? false,
  });

  const seniors = users?.filter((u) => u.role === 'senior') || [];
  const caregivers = users?.filter((u) => ['caregiver', 'family_member'].includes(u.role)) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'create') {
        const validation = createRelationshipSchema.safeParse(formData);
        if (!validation.success) {
          toast({
            title: 'Validation Error',
            description: validation.error.errors[0]?.message || 'Please check your inputs',
            variant: 'destructive',
          });
          return;
        }

        await createMutation.mutateAsync(validation.data);
        toast({
          title: 'Relationship created',
          description: 'Care relationship has been created successfully.',
        });
      } else {
        const updateData: UpdateRelationshipInput = {
          relationship_type: formData.relationship_type as any,
          relationship_label: formData.relationship_label,
          can_view_health_data: formData.can_view_health_data,
          can_receive_alerts: formData.can_receive_alerts,
          can_modify_settings: formData.can_modify_settings,
        };

        await updateMutation.mutateAsync(updateData);
        toast({
          title: 'Relationship updated',
          description: 'Care relationship has been updated successfully.',
        });
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save relationship',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Care Relationship' : 'Edit Care Relationship'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Assign a caregiver to a patient and configure permissions.'
              : 'Update relationship settings and permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <>
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient_id">
                  Patient <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="patient_id">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {seniors.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Caregiver Selection */}
              <div className="space-y-2">
                <Label htmlFor="caregiver_id">
                  Caregiver <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.caregiver_id}
                  onValueChange={(value) => setFormData({ ...formData, caregiver_id: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="caregiver_id">
                    <SelectValue placeholder="Select a caregiver" />
                  </SelectTrigger>
                  <SelectContent>
                    {caregivers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({formatRole(user.role)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label htmlFor="relationship_type">Relationship Type</Label>
            <Select
              value={formData.relationship_type}
              onValueChange={(value) => setFormData({ ...formData, relationship_type: value as any })}
              disabled={isLoading}
            >
              <SelectTrigger id="relationship_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary_caregiver">Primary Caregiver</SelectItem>
                <SelectItem value="family_member">Family Member</SelectItem>
                <SelectItem value="healthcare_provider">Healthcare Provider</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Relationship Label */}
          <div className="space-y-2">
            <Label htmlFor="relationship_label">Custom Label (Optional)</Label>
            <Input
              id="relationship_label"
              value={formData.relationship_label}
              onChange={(e) => setFormData({ ...formData, relationship_label: e.target.value })}
              placeholder="e.g., Primary Nurse, Daughter, etc."
              disabled={isLoading}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <Label>Permissions</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="can_view_health_data" className="font-normal">
                  View Health Data
                </Label>
                <Switch
                  id="can_view_health_data"
                  checked={formData.can_view_health_data}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, can_view_health_data: checked })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="can_receive_alerts" className="font-normal">
                  Receive Alerts
                </Label>
                <Switch
                  id="can_receive_alerts"
                  checked={formData.can_receive_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, can_receive_alerts: checked })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="can_modify_settings" className="font-normal">
                  Modify Settings
                </Label>
                <Switch
                  id="can_modify_settings"
                  checked={formData.can_modify_settings}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, can_modify_settings: checked })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Relationship'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Delete Confirmation Dialog Component
 */
interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: AdminCareRelationship | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onOpenChange,
  relationship,
  onConfirm,
  isDeleting,
}) => {
  if (!relationship) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Care Relationship</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this care relationship? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Patient:</p>
            <p className="text-sm text-muted-foreground">
              {relationship.patient?.full_name || 'Unknown'} ({relationship.patient?.email})
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Caregiver:</p>
            <p className="text-sm text-muted-foreground">
              {relationship.caregiver?.full_name || 'Unknown'} ({relationship.caregiver?.email})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * AdminCareRelationships Page Component
 */
export const AdminCareRelationships: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [selectedRelationship, setSelectedRelationship] = useState<AdminCareRelationship | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: relationships, isLoading, error } = useAdminRelationships({
    status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
  });

  const updateMutation = useUpdateRelationship(selectedRelationship?.id || '');
  const deleteMutation = useDeleteRelationship(selectedRelationship?.id || '');
  const { toast } = useToast();

  // Check for create action in URL
  React.useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateDialogOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleApprove = async (relationship: AdminCareRelationship) => {
    try {
      await updateMutation.mutateAsync({ status: 'active' });
      toast({
        title: 'Relationship approved',
        description: 'Care relationship has been activated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve relationship',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (relationship: AdminCareRelationship) => {
    try {
      await updateMutation.mutateAsync({ status: 'inactive' });
      toast({
        title: 'Relationship rejected',
        description: 'Care relationship has been deactivated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject relationship',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      toast({
        title: 'Relationship deleted',
        description: 'Care relationship has been permanently deleted.',
      });
      setDeleteDialogOpen(false);
      setSelectedRelationship(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete relationship',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout
      title="Care Relationships"
      description="Manage patient-caregiver relationships"
      breadcrumbs={[{ label: 'Care Relationships' }]}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {relationships
                ? `${relationships.length} relationship${relationships.length !== 1 ? 's' : ''} found`
                : 'Loading...'}
            </p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" aria-label="Filter by status">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <LinkIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Create Relationship
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>Failed to load relationships. Please try again.</AlertDescription>
          </Alert>
        )}

        {/* Relationships Table */}
        <Card>
          <CardHeader>
            <CardTitle>Care Relationships</CardTitle>
            <CardDescription>View and manage all care relationships</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : relationships && relationships.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Caregiver</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relationships.map((relationship) => (
                      <TableRow key={relationship.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium" style={{ color: '#2F4733' }}>
                              {relationship.patient?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {relationship.patient?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium" style={{ color: '#2F4733' }}>
                              {relationship.caregiver?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {relationship.caregiver?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{relationship.relationship_type}</Badge>
                          {relationship.relationship_label && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {relationship.relationship_label}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: getRelationshipStatusColor(relationship.status),
                              color: '#2F4733',
                            }}
                          >
                            {relationship.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {relationship.can_view_health_data && (
                              <Badge variant="secondary" className="text-xs">
                                View
                              </Badge>
                            )}
                            {relationship.can_receive_alerts && (
                              <Badge variant="secondary" className="text-xs">
                                Alerts
                              </Badge>
                            )}
                            {relationship.can_modify_settings && (
                              <Badge variant="secondary" className="text-xs">
                                Modify
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatAdminDate(relationship.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {relationship.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRelationship(relationship);
                                    handleApprove(relationship);
                                  }}
                                >
                                  <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRelationship(relationship);
                                    handleReject(relationship);
                                  }}
                                >
                                  <X className="h-4 w-4 text-red-600" aria-hidden="true" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRelationship(relationship);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRelationship(relationship);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-lg font-medium mb-2">No relationships found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first care relationship'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <RelationshipDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        relationship={selectedRelationship}
        mode="edit"
      />

      <RelationshipDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        relationship={selectedRelationship}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </AdminLayout>
  );
};

export default AdminCareRelationships;
