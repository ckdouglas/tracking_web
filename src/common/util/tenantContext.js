import { useSelector } from 'react-redux';

export const useTenant = () => useSelector((state) => state.session.tenant);

export const useTenantId = () => {
  const tenant = useTenant();
  return tenant?.id;
};

export const useTenantName = () => {
  const tenant = useTenant();
  return tenant?.name;
};

export const useTenantSubdomain = () => {
  const tenant = useTenant();
  return tenant?.subdomain;
};

export const useIsSuperAdmin = () => {
  const user = useSelector((state) => state.session.user);
  const tenant = useTenant();
  return user?.administrator && tenant?.plan === 'SUPER_ADMIN';
};

export const useIsTenantAdmin = () => {
  const user = useSelector((state) => state.session.user);
  const roles = useSelector((state) => state.session.userRoles);
  return user?.administrator || roles?.some(role => role.name === 'TENANT_ADMIN');
};

export const useIsTenantManager = () => {
  const user = useSelector((state) => state.session.user);
  const roles = useSelector((state) => state.session.userRoles);
  return user?.administrator || 
         roles?.some(role => ['TENANT_ADMIN', 'TENANT_MANAGER'].includes(role.name));
};

export const useUserRoles = () => useSelector((state) => state.session.userRoles);

export const useHasRole = (roleName) => {
  const roles = useUserRoles();
  return roles?.some(role => role.name === roleName);
};

export const useHasPermission = (resource, action) => {
  const user = useSelector((state) => state.session.user);
  const roles = useUserRoles();
  
  if (user?.administrator) {
    return true;
  }
  
  if (!roles) return false;
  
  return roles.some(role => {
    if (!role.permissions) return false;
    
    const permissions = role.permissions.split(',');
    return permissions.includes('ALL') || 
           permissions.includes(`${resource}:*`) || 
           permissions.includes(`${resource}:${action}`);
  });
};

export const useCanManageUsers = () => {
  return useHasPermission('USER', 'CREATE') || 
         useHasPermission('USER', 'UPDATE') || 
         useHasPermission('USER', 'DELETE');
};

export const useCanManageDevices = () => {
  return useHasPermission('DEVICE', 'CREATE') || 
         useHasPermission('DEVICE', 'UPDATE') || 
         useHasPermission('DEVICE', 'DELETE');
};

export const useCanViewReports = () => {
  return useHasPermission('REPORT', 'READ');
};

export const useCanExportReports = () => {
  return useHasPermission('REPORT', 'EXPORT');
};

export const useCanManageGeofences = () => {
  return useHasPermission('GEOFENCE', 'CREATE') || 
         useHasPermission('GEOFENCE', 'UPDATE') || 
         useHasPermission('GEOFENCE', 'DELETE');
};

export const useCanManageTenant = () => {
  return useHasPermission('TENANT', 'MANAGE');
};
