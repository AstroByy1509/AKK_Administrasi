import { UserProfile } from '../types';

export const canAccess = (user: UserProfile, moduleId: string, subMenuId?: string): boolean => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.status !== 'approved') return false;

  // Special check for Executive Dashboard ('dashboard') governed by user permissions under sistem_pengguna -> dashboard_eksekutif
  if (moduleId === 'dashboard') {
    if (user.permissions && user.permissions.modules) {
      const sysMod = user.permissions.modules['sistem_pengguna'];
      if (sysMod && sysMod.enabled) {
        const sub = sysMod.subMenus?.['dashboard_eksekutif'];
        if (sub && sub !== 'none') return true;
        if (sub === 'none') return false;
      }
    }
    // Default roles restriction for Executive Dashboard: Drivers, Helpers, Security, General Staff cannot view unless explicitly granted
    if (user.role === 'driver' || user.role === 'crew_helper' || user.role === 'security') return false;
    return true;
  }

  // Granular permissions check if configured
  if (user.permissions && user.permissions.modules) {
    const modulePerms = user.permissions.modules[moduleId];
    if (!modulePerms || !modulePerms.enabled) return false;

    if (subMenuId) {
      const subPerm = modulePerms.subMenus?.[subMenuId];
      if (!subPerm || subPerm === 'none') return false;
    }
    return true;
  }

  // Robust default role boundaries if explicit permissions object is not yet saved
  if (user.role === 'driver') {
    if ((moduleId === 'logistics' || moduleId === 'driver_portal') && (!subMenuId || subMenuId === 'portal_driver')) return true;
    return false;
  }

  if (user.role === 'spv_logistik') {
    // SPV has access to logistics operations and tracking, but restricted from user management & finance
    if (moduleId === 'users' || moduleId === 'sistem_pengguna' || moduleId === 'architecture') return false;
    if (moduleId === 'finance_tax' || moduleId === 'finance_dashboard') return false;
    return true;
  }

  if (user.role === 'sales_admin') {
    // Sales Admin restricted from system user approval and finance
    if (moduleId === 'users' || moduleId === 'sistem_pengguna' || moduleId === 'architecture') return false;
    if (moduleId === 'finance_tax' || moduleId === 'finance_dashboard') return false;
    return true;
  }

  return true;
};


