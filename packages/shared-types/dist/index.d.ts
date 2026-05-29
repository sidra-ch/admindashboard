export declare const SubscriptionPlan: {
    readonly STARTER: "STARTER";
    readonly PRO: "PRO";
    readonly ENTERPRISE: "ENTERPRISE";
};
export type SubscriptionPlan = typeof SubscriptionPlan[keyof typeof SubscriptionPlan];
export declare const UserRoleCode: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly ADMIN: "ADMIN";
    readonly MANAGER: "MANAGER";
    readonly STAFF: "STAFF";
    readonly ACCOUNTANT: "ACCOUNTANT";
};
export type UserRoleCode = typeof UserRoleCode[keyof typeof UserRoleCode];
export declare const PermissionCode: {
    readonly DASHBOARD_READ: "dashboard:read";
    readonly TENANT_READ: "tenant:read";
    readonly TENANT_UPDATE: "tenant:update";
    readonly BRANCH_READ: "branch:read";
    readonly BRANCH_WRITE: "branch:write";
    readonly USER_READ: "user:read";
    readonly USER_WRITE: "user:write";
    readonly AUDIT_READ: "audit:read";
    readonly CAR_READ: "car:read";
    readonly CAR_WRITE: "car:write";
    readonly CUSTOMER_READ: "customer:read";
    readonly CUSTOMER_WRITE: "customer:write";
    readonly RENTAL_READ: "rental:read";
    readonly RENTAL_WRITE: "rental:write";
    readonly PAYMENT_READ: "payment:read";
    readonly PAYMENT_WRITE: "payment:write";
    readonly MAINTENANCE_READ: "maintenance:read";
    readonly MAINTENANCE_WRITE: "maintenance:write";
    readonly DOCUMENT_READ: "document:read";
    readonly DOCUMENT_WRITE: "document:write";
    readonly REPORT_READ: "report:read";
};
export type PermissionCode = typeof PermissionCode[keyof typeof PermissionCode];
export type JwtUser = {
    sub: string;
    tenantId: string;
    email: string;
    role: UserRoleCode;
    permissions: PermissionCode[];
};
export type ThemeMode = 'light' | 'dark' | 'system';
