export const SubscriptionPlan = {
  STARTER: 'STARTER',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const;
export type SubscriptionPlan = typeof SubscriptionPlan[keyof typeof SubscriptionPlan];

export const UserRoleCode = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  ACCOUNTANT: 'ACCOUNTANT',
} as const;
export type UserRoleCode = typeof UserRoleCode[keyof typeof UserRoleCode];

export const PermissionCode = {
  DASHBOARD_READ: 'dashboard:read',
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  BRANCH_READ: 'branch:read',
  BRANCH_WRITE: 'branch:write',
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  AUDIT_READ: 'audit:read',
  CAR_READ: 'car:read',
  CAR_WRITE: 'car:write',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_WRITE: 'customer:write',
  RENTAL_READ: 'rental:read',
  RENTAL_WRITE: 'rental:write',
  PAYMENT_READ: 'payment:read',
  PAYMENT_WRITE: 'payment:write',
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_WRITE: 'maintenance:write',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_WRITE: 'document:write',
  REPORT_READ: 'report:read',
} as const;
export type PermissionCode = typeof PermissionCode[keyof typeof PermissionCode];

export type JwtUser = {
  sub: string;
  tenantId: string;
  email: string;
  role: UserRoleCode;
  permissions: PermissionCode[];
};

export type ThemeMode = 'light' | 'dark' | 'system';
