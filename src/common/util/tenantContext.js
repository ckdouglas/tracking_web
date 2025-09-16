import { useSelector } from 'react-redux';

// Multi-tenant RBAC utility hooks
export const useTenant = () => {
  return useSelector((state) => state.session.tenant);
};

export const useIsSuperAdmin = () => {
  const user = useSelector((state) => state.session.user);
  return user?.administrator && user?.attributes?.isSuperAdmin;
};

export const useIsTenantAdmin = () => {
  const user = useSelector((state) => state.session.user);
  return user?.administrator && user?.attributes?.isTenantAdmin;
};

export const useIsTenantManager = () => {
  const user = useSelector((state) => state.session.user);
  return user?.attributes?.isTenantManager;
};

export const useCanManageTenant = () => {
  const user = useSelector((state) => state.session.user);
  return user?.administrator || user?.attributes?.canManageTenant;
};

export const useHasPermission = (resource, action) => {
  const user = useSelector((state) => state.session.user);
  const permissions = user?.attributes?.permissions || [];
  const permission = `${resource}:${action}`;
  return permissions.includes(permission) || permissions.includes('ALL');
};

export const useCanManageUsers = () => {
  return useHasPermission('USER', 'CREATE') || useHasPermission('USER', 'UPDATE');
};

export const useCanManageDevices = () => {
  return useHasPermission('DEVICE', 'CREATE') || useHasPermission('DEVICE', 'UPDATE');
};

export const useCanViewReports = () => {
  return useHasPermission('REPORT', 'READ');
};

export const useCanExportReports = () => {
  return useHasPermission('REPORT', 'EXPORT');
};

export const useUserRoles = () => {
  const user = useSelector((state) => state.session.user);
  return user?.attributes?.roles || [];
};