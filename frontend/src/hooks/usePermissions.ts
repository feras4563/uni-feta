import { useAuth } from '../contexts/JWTAuthContext';
import { hasClientPermission } from '../lib/jwt-auth';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    return hasClientPermission(user.role, resource, action);
  };

  const canView = (resource: string): boolean => hasPermission(resource, 'view');
  const canCreate = (resource: string): boolean => hasPermission(resource, 'create');
  const canEdit = (resource: string): boolean => hasPermission(resource, 'edit');
  const canDelete = (resource: string): boolean => hasPermission(resource, 'delete');

  const isManager = user?.role === 'manager';
  const isStaff = user?.role === 'staff';

  return {
    hasPermission,
    hasClientPermission: (resource: string, action: string) => hasPermission(resource, action),
    canView,
    canCreate,
    canEdit,
    canDelete,
    isManager,
    isStaff,
    user,
  };
}
