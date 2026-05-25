import { PermissionCode, UserRoleCode } from '@fleetrent/shared-types';
import { hashSync } from '@node-rs/bcrypt';
import {
  BookingStatus,
  CarStatus,
  CustomerRiskLevel,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  RentalStatus,
  SubscriptionPlan,
  UserStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { code: PermissionCode.DASHBOARD_READ, name: 'View dashboard analytics' },
    { code: PermissionCode.TENANT_READ, name: 'View tenant settings' },
    { code: PermissionCode.TENANT_UPDATE, name: 'Manage tenant settings' },
    { code: PermissionCode.BRANCH_READ, name: 'View branches' },
    { code: PermissionCode.BRANCH_WRITE, name: 'Manage branches' },
    { code: PermissionCode.USER_READ, name: 'View users' },
    { code: PermissionCode.USER_WRITE, name: 'Manage users' },
    { code: PermissionCode.AUDIT_READ, name: 'View audit logs' },
    { code: PermissionCode.CAR_READ, name: 'View fleet vehicles' },
    { code: PermissionCode.CAR_WRITE, name: 'Manage fleet vehicles' },
    { code: PermissionCode.CUSTOMER_READ, name: 'View customers' },
    { code: PermissionCode.CUSTOMER_WRITE, name: 'Manage customers' },
    { code: PermissionCode.RENTAL_READ, name: 'View rentals and bookings' },
    { code: PermissionCode.RENTAL_WRITE, name: 'Manage rentals and bookings' },
    { code: PermissionCode.PAYMENT_READ, name: 'View payments and invoices' },
    { code: PermissionCode.PAYMENT_WRITE, name: 'Manage payments and invoices' },
    { code: PermissionCode.MAINTENANCE_READ, name: 'View maintenance jobs' },
    { code: PermissionCode.MAINTENANCE_WRITE, name: 'Manage maintenance jobs' },
    { code: PermissionCode.DOCUMENT_READ, name: 'View documents' },
    { code: PermissionCode.DOCUMENT_WRITE, name: 'Upload and delete documents' },
    { code: PermissionCode.REPORT_READ, name: 'View reports and exports' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }

  const roleMatrix = {
    [UserRoleCode.SUPER_ADMIN]: permissions.map((permission) => permission.code),
    [UserRoleCode.ADMIN]: permissions.map((permission) => permission.code),
    [UserRoleCode.MANAGER]: [
      PermissionCode.DASHBOARD_READ,
      PermissionCode.TENANT_READ,
      PermissionCode.BRANCH_READ,
      PermissionCode.USER_READ,
      PermissionCode.CAR_READ,
      PermissionCode.CAR_WRITE,
      PermissionCode.CUSTOMER_READ,
      PermissionCode.CUSTOMER_WRITE,
      PermissionCode.RENTAL_READ,
      PermissionCode.RENTAL_WRITE,
      PermissionCode.PAYMENT_READ,
      PermissionCode.MAINTENANCE_READ,
      PermissionCode.MAINTENANCE_WRITE,
      PermissionCode.DOCUMENT_READ,
      PermissionCode.REPORT_READ,
      PermissionCode.AUDIT_READ,
    ],
    [UserRoleCode.STAFF]: [
      PermissionCode.DASHBOARD_READ,
      PermissionCode.BRANCH_READ,
      PermissionCode.CAR_READ,
      PermissionCode.CUSTOMER_READ,
      PermissionCode.RENTAL_READ,
      PermissionCode.MAINTENANCE_READ,
      PermissionCode.DOCUMENT_READ,
    ],
    [UserRoleCode.ACCOUNTANT]: [
      PermissionCode.DASHBOARD_READ,
      PermissionCode.TENANT_READ,
      PermissionCode.USER_READ,
      PermissionCode.PAYMENT_READ,
      PermissionCode.PAYMENT_WRITE,
      PermissionCode.REPORT_READ,
      PermissionCode.AUDIT_READ,
    ],
  } as const;

  for (const [code, permissionCodes] of Object.entries(roleMatrix)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: code.replaceAll('_', ' ') },
      create: { code, name: code.replaceAll('_', ' ') },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    const permissionRecords = await prisma.permission.findMany({
      where: { code: { in: [...permissionCodes] } },
      select: { id: true },
    });

    await prisma.rolePermission.createMany({
      data: permissionRecords.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'fleetrent-demo' },
    update: {},
    create: {
      name: 'FleetRent Pro Demo',
      slug: 'fleetrent-demo',
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
    },
  });

  const branch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'SYD-HQ' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Sydney HQ',
      code: 'SYD-HQ',
      city: 'Sydney',
      state: 'NSW',
    },
  });

  const melbourneBranch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'MEL-CBD' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Melbourne CBD',
      code: 'MEL-CBD',
      city: 'Melbourne',
      state: 'VIC',
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: UserRoleCode.SUPER_ADMIN } });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@fleetrentpro.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      roleId: adminRole.id,
      firstName: 'Fleet',
      lastName: 'Administrator',
      email: 'admin@fleetrentpro.com',
      passwordHash: hashSync('Admin@12345', 12),
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.payment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.rentalExtension.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.rental.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.booking.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.car.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.customer.deleteMany({ where: { tenantId: tenant.id } });

  const categoryNames = ['SUV', 'EV', 'People Mover'];
  const carCategories: Record<string, { id: string }> = {};
  for (const name of categoryNames) {
    const cat = await prisma.carCategory.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      update: {},
      create: { tenantId: tenant.id, name },
    });
    carCategories[name] = cat;
  }

  const cars = await Promise.all([
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        registrationNumber: 'NSW-AX41',
        brand: 'Toyota',
        model: 'RAV4',
        year: 2024,
        color: 'Silver',
        categoryId: carCategories['SUV'].id,
        odometerKm: 18440,
        dailyRateCents: 12900,
        status: CarStatus.RENTED,
        trackerInstalled: true,
        nextServiceDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        insuranceExpiry: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        registrationNumber: 'NSW-BX52',
        brand: 'Tesla',
        model: 'Model Y',
        year: 2025,
        color: 'White',
        categoryId: carCategories['EV'].id,
        odometerKm: 7440,
        dailyRateCents: 18900,
        status: CarStatus.AVAILABLE,
        trackerInstalled: true,
        nextServiceDue: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        insuranceExpiry: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        branchId: melbourneBranch.id,
        registrationNumber: 'VIC-CX63',
        brand: 'Kia',
        model: 'Carnival',
        year: 2023,
        color: 'Black',
        categoryId: carCategories['People Mover'].id,
        odometerKm: 26110,
        dailyRateCents: 14900,
        status: CarStatus.RENTED,
        trackerInstalled: true,
        nextServiceDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        insuranceExpiry: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        branchId: melbourneBranch.id,
        registrationNumber: 'VIC-DX74',
        brand: 'Hyundai',
        model: 'Tucson',
        year: 2022,
        color: 'Graphite',
        categoryId: carCategories['SUV'].id,
        odometerKm: 33400,
        dailyRateCents: 11900,
        status: CarStatus.MAINTENANCE,
        trackerInstalled: false,
        nextServiceDue: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        insuranceExpiry: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        registrationNumber: 'NSW-EX85',
        brand: 'Ford',
        model: 'Everest',
        year: 2024,
        color: 'Blue',
        categoryId: carCategories['SUV'].id,
        odometerKm: 14120,
        dailyRateCents: 15900,
        status: CarStatus.AVAILABLE,
        trackerInstalled: true,
        nextServiceDue: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        insuranceExpiry: new Date(Date.now() + 140 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Olivia',
        lastName: 'Brown',
        email: 'olivia.brown@example.com',
        phone: '+61 410 200 100',
        licenseNumber: 'NSW1234501',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        riskLevel: CustomerRiskLevel.SAFE,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Liam',
        lastName: 'Patel',
        email: 'liam.patel@example.com',
        phone: '+61 410 200 101',
        licenseNumber: 'VIC2234502',
        licenseExpiry: new Date(Date.now() + 280 * 24 * 60 * 60 * 1000),
        riskLevel: CustomerRiskLevel.MEDIUM,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Mia',
        lastName: 'Chen',
        email: 'mia.chen@example.com',
        phone: '+61 410 200 102',
        licenseNumber: 'NSW3234503',
        licenseExpiry: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
        riskLevel: CustomerRiskLevel.HIGH,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Noah',
        lastName: 'Wilson',
        email: 'noah.wilson@example.com',
        phone: '+61 410 200 103',
        licenseNumber: 'QLD4234504',
        licenseExpiry: new Date(Date.now() + 420 * 24 * 60 * 60 * 1000),
        riskLevel: CustomerRiskLevel.SAFE,
      },
    }),
  ]);

  const booking = await prisma.booking.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      carId: cars[1].id,
      customerId: customers[3].id,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      totalAmountCents: 56700,
      status: BookingStatus.CONFIRMED,
      notes: 'Airport pickup requested',
    },
  });

  const activeRental = await prisma.rental.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      carId: cars[0].id,
      customerId: customers[0].id,
      pickupAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expectedReturnAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      startOdometerKm: 18210,
      totalAmountCents: 38700,
      balanceDueCents: 12900,
      depositAmountCents: 10000,
      status: RentalStatus.ACTIVE,
    },
  });

  const overdueRental = await prisma.rental.create({
    data: {
      tenantId: tenant.id,
      branchId: melbourneBranch.id,
      carId: cars[2].id,
      customerId: customers[2].id,
      pickupAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      expectedReturnAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      startOdometerKm: 25700,
      totalAmountCents: 59600,
      balanceDueCents: 21800,
      depositAmountCents: 15000,
      lateFeeAmountCents: 4500,
      status: RentalStatus.OVERDUE,
    },
  });

  const completedRental = await prisma.rental.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      bookingId: booking.id,
      carId: cars[4].id,
      customerId: customers[1].id,
      pickupAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      expectedReturnAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      actualReturnAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      startOdometerKm: 13600,
      endOdometerKm: 14120,
      totalAmountCents: 63600,
      balanceDueCents: 0,
      depositAmountCents: 15000,
      status: RentalStatus.COMPLETED,
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.CONVERTED },
  });

  await prisma.rentalExtension.create({
    data: {
      tenantId: tenant.id,
      rentalId: activeRental.id,
      newReturnAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      additionalAmountCents: 12900,
      notes: 'Customer requested one-day extension',
    },
  });

  const activeInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      rentalId: activeRental.id,
      invoiceNumber: 'INV-2026-1001',
      subtotalCents: 38700,
      taxCents: 3870,
      totalCents: 42570,
      status: InvoiceStatus.ISSUED,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  const overdueInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      rentalId: overdueRental.id,
      invoiceNumber: 'INV-2026-1002',
      subtotalCents: 59600,
      taxCents: 5960,
      totalCents: 65560,
      status: InvoiceStatus.ISSUED,
      dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  const completedInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      rentalId: completedRental.id,
      invoiceNumber: 'INV-2026-1003',
      subtotalCents: 63600,
      taxCents: 6360,
      totalCents: 69960,
      status: InvoiceStatus.PAID,
      dueAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.createMany({
    data: [
      {
        tenantId: tenant.id,
        rentalId: activeRental.id,
        customerId: customers[0].id,
        invoiceId: activeInvoice.id,
        amountCents: 29670,
        method: PaymentMethod.CARD,
        status: PaymentStatus.PARTIAL,
        reference: 'PAY-1001',
        paidAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        rentalId: overdueRental.id,
        customerId: customers[2].id,
        invoiceId: overdueInvoice.id,
        amountCents: 25000,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        reference: 'PAY-1002',
      },
      {
        tenantId: tenant.id,
        rentalId: completedRental.id,
        customerId: customers[1].id,
        invoiceId: completedInvoice.id,
        amountCents: 69960,
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PAID,
        reference: 'PAY-1003',
        paidAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
