import type { PermissionCode, UserRoleCode } from '@fleetrent/shared-types';

export type AuthenticatedUser = {
  sub: string;
  tenantId: string;
  email: string;
  role: UserRoleCode;
  permissions: PermissionCode[];
};
