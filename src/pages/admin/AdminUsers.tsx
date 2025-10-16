/**
 * AdminUsers Page
 *
 * User management interface for viewing, creating, editing,
 * and managing user accounts and roles.
 */

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/admin/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  Search,
  Filter,
  Edit,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Trash2,
} from 'lucide-react';
import {
  formatAdminDate,
  formatRole,
  getRoleBadgeVariant,
  getInitials,
  debounce,
} from '@/lib/admin/utils';
import { createUserSchema, updateUserSchema } from '@/lib/admin/validation';
import type { CreateUserInput, UpdateUserInput } from '@/lib/admin/types';
import type { AdminUserProfile } from '@/lib/admin/types';

/**
 * User Filter Component
 */
interface UserFiltersProps {
  onRoleChange: (role: string) => void;
  onSearchChange: (search: string) => void;
  selectedRole: string;
  searchTerm: string;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  onRoleChange,
  onSearchChange,
  selectedRole,
  searchTerm,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search users"
          />
        </div>
      </div>
      <div className="w-full sm:w-48">
        <Select value={selectedRole} onValueChange={onRoleChange}>
          <SelectTrigger aria-label="Filter by role">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="caregiver">Caregiver</SelectItem>
            <SelectItem value="family_member">Family Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

/**
 * Create/Edit User Dialog
 */
interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUserProfile | null;
  mode: 'create' | 'edit';
}

const UserDialog: React.FC<UserDialogProps> = ({ open, onOpenChange, user, mode }) => {
  const { toast } = useToast();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser(user?.id || '');

  const [formData, setFormData] = useState<Partial<CreateUserInput>>({
    email: user?.email || '',
    full_name: user?.full_name || '',
    role: user?.role || 'senior',
    display_name: user?.display_name || '',
    phone_number: user?.phone_number || '',
    date_of_birth: user?.date_of_birth || '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
    sendInvitation: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email,
        full_name: user.full_name || '',
        role: user.role,
        display_name: user.display_name || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });
    } else if (mode === 'create') {
      setFormData({
        email: '',
        full_name: '',
        role: 'senior',
        display_name: '',
        phone_number: '',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        sendInvitation: false,
      });
    }
    setErrors({});
  }, [user, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (mode === 'create') {
        const validation = createUserSchema.safeParse(formData);
        if (!validation.success) {
          const newErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(newErrors);
          return;
        }

        await createUserMutation.mutateAsync(validation.data);
        toast({
          title: 'User created',
          description: 'New user has been created successfully.',
        });
      } else {
        const validation = updateUserSchema.safeParse(formData);
        if (!validation.success) {
          const newErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(newErrors);
          return;
        }

        await updateUserMutation.mutateAsync(validation.data);
        toast({
          title: 'User updated',
          description: 'User information has been updated successfully.',
        });
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save user',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new user to the system. An invitation email can be sent automatically.'
              : 'Update user information and role.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={mode === 'edit' || isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={isLoading}
              aria-invalid={!!errors.full_name}
              aria-describedby={errors.full_name ? 'full_name-error' : undefined}
            />
            {errors.full_name && (
              <p id="full_name-error" className="text-sm text-destructive">
                {errors.full_name}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as CreateUserInput['role'] })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="role" aria-label="Select user role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="caregiver">Caregiver</SelectItem>
                <SelectItem value="family_member">Family Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1234567890"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Emergency Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) =>
                  setFormData({ ...formData, emergency_contact_name: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            {/* Emergency Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) =>
                  setFormData({ ...formData, emergency_contact_phone: e.target.value })
                }
                placeholder="+1234567890"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * User Details Dialog
 */
interface UserDetailsDialogProps {
  user: AdminUserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  user,
  open,
  onOpenChange,
  onEdit,
}) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback style={{ backgroundColor: '#C9EBC0', color: '#2F4733' }}>
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{user.full_name}</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <div className="mt-1">
                <Badge variant={getRoleBadgeVariant(user.role)}>{formatRole(user.role)}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p className="text-sm font-medium mt-1">{formatAdminDate(user.created_at)}</p>
            </div>
          </div>

          {user.display_name && (
            <div>
              <Label className="text-muted-foreground">Display Name</Label>
              <p className="text-sm font-medium mt-1">{user.display_name}</p>
            </div>
          )}

          {user.phone_number && (
            <div>
              <Label className="text-muted-foreground">
                <Phone className="inline h-4 w-4 mr-1" aria-hidden="true" />
                Phone Number
              </Label>
              <p className="text-sm font-medium mt-1">{user.phone_number}</p>
            </div>
          )}

          {user.date_of_birth && (
            <div>
              <Label className="text-muted-foreground">
                <Calendar className="inline h-4 w-4 mr-1" aria-hidden="true" />
                Date of Birth
              </Label>
              <p className="text-sm font-medium mt-1">{user.date_of_birth}</p>
            </div>
          )}

          {(user.emergency_contact_name || user.emergency_contact_phone) && (
            <div>
              <Label className="text-muted-foreground">Emergency Contact</Label>
              <div className="mt-1 space-y-1">
                {user.emergency_contact_name && (
                  <p className="text-sm font-medium">{user.emergency_contact_name}</p>
                )}
                {user.emergency_contact_phone && (
                  <p className="text-sm text-muted-foreground">{user.emergency_contact_phone}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">Last Active</Label>
            <p className="text-sm font-medium mt-1">{formatAdminDate(user.last_active_at)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
            Edit User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Delete User Confirmation Dialog
 */
interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserProfile | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onConfirm,
  isDeleting,
}) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone and will permanently
            delete the user's account and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback style={{ backgroundColor: '#C9EBC0', color: '#2F4733' }}>
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1">
                {formatRole(user.role)}
              </Badge>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              This will delete all care relationships, notes, and activity logs associated with this user.
            </AlertDescription>
          </Alert>
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
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * AdminUsers Page Component
 */
export const AdminUsers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserProfile | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Debounce search
  const debouncedSearchHandler = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, 300),
    []
  );

  React.useEffect(() => {
    debouncedSearchHandler(searchTerm);
  }, [searchTerm, debouncedSearchHandler]);

  // Fetch users with filters
  const { data: users, isLoading, error } = useAdminUsers({
    role: selectedRole !== 'all' ? (selectedRole as any) : undefined,
    search: debouncedSearch || undefined,
  });

  // Check for create action in URL
  React.useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateDialogOpen(true);
      // Remove action param
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleViewDetails = (user: AdminUserProfile) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleEditUser = (user?: AdminUserProfile) => {
    if (user) {
      setSelectedUser(user);
    }
    setDetailsDialogOpen(false);
    setEditDialogOpen(true);
  };

  const deleteMutation = useDeleteUser(selectedUser?.id || '');
  const { toast } = useToast();

  const handleDeleteUser = async () => {
    try {
      await deleteMutation.mutateAsync();
      toast({
        title: 'User deleted',
        description: 'User has been permanently deleted.',
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout
      title="User Management"
      description="Manage user accounts and roles"
      breadcrumbs={[{ label: 'Users' }]}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {users ? `${users.length} user${users.length !== 1 ? 's' : ''} found` : 'Loading...'}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
            Create User
          </Button>
        </div>

        {/* Filters */}
        <UserFilters
          onRoleChange={setSelectedRole}
          onSearchChange={setSearchTerm}
          selectedRole={selectedRole}
          searchTerm={searchTerm}
        />

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>Failed to load users. Please try again.</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>View and manage all system users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback
                                style={{ backgroundColor: '#C9EBC0', color: '#2F4733' }}
                              >
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium" style={{ color: '#2F4733' }}>
                                {user.full_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {formatRole(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.phone_number && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" aria-hidden="true" />
                                {user.phone_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatAdminDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatAdminDate(user.last_active_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(user)}
                            >
                              View
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Edit {user.full_name}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                              <span className="sr-only">Delete {user.full_name}</span>
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
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-lg font-medium mb-2">No users found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || selectedRole !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first user'}
                </p>
                {!searchTerm && selectedRole === 'all' && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Create User
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <UserDetailsDialog
        user={selectedUser}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onEdit={() => handleEditUser(selectedUser || undefined)}
      />

      <UserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        mode="edit"
      />

      <UserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} mode="create" />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
        onConfirm={handleDeleteUser}
        isDeleting={deleteMutation.isPending}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
