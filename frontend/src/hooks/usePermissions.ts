import { useAuth } from '../contexts/JWTAuthContext';

export function usePermissions() {
  const { user, hasPermission: contextHasPermission } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    // Use the context's dynamic permission check (DB-driven from backend)
    return contextHasPermission(resource, action);
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
