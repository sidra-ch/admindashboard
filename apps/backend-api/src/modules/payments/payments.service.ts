import { Injectable } from '@nestjs/common';
import { AuditActionType, InvoiceStatus, PaymentStatus, Prisma, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailer: MailerService,
  ) {}

  async listForTenant(tenantId: string, query: ListPaymentsQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const where: Prisma.PaymentWhereInput = {
      tenantId,
      status: query.status,
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          rental: { include: { car: true } },
          invoice: true,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getRevenueSummary(tenantId: string) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [monthlyRevenue, pendingBalance, paidCount, pendingCount] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { tenantId, status: PaymentStatus.PAID, paidAt: { gte: startOfMonth } },
        _sum: { amountCents: true },
      }),
      this.prisma.rental.aggregate({
        where: { tenantId, status: { in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE] } },
        _sum: { balanceDueCents: true },
      }),
      this.prisma.payment.count({ where: { tenantId, status: PaymentStatus.PAID } }),
      this.prisma.payment.count({ where: { tenantId, status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] } } }),
    ]);

    return {
      monthlyRevenueCents: monthlyRevenue._sum.amountCents ?? 0,
      pendingBalanceCents: pendingBalance._sum.balanceDueCents ?? 0,
      paidCount,
      pendingCount,
    };
  }

  async create(actor: AuthenticatedUser, dto: CreatePaymentDto) {
    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          tenantId: actor.tenantId,
          rentalId: dto.rentalId,
          customerId: dto.customerId,
          invoiceId: dto.invoiceId,
          amountCents: dto.amountCents,
          method: dto.method,
          status: dto.status ?? PaymentStatus.PAID,
          reference: dto.reference,
          paidAt: dto.status === PaymentStatus.PENDING ? null : new Date(),
        },
      });

      if (dto.rentalId) {
        const rental = await tx.rental.findUnique({ where: { id: dto.rentalId } });
        if (rental) {
          const balanceDueCents = Math.max(0, rental.balanceDueCents - dto.amountCents);
          await tx.rental.update({ where: { id: rental.id }, data: { balanceDueCents } });
        }
      }

      if (dto.invoiceId) {
        const invoicePayments = await tx.payment.aggregate({
          where: { invoiceId: dto.invoiceId, status: PaymentStatus.PAID },
          _sum: { amountCents: true },
        });
        const invoice = await tx.invoice.findUnique({ where: { id: dto.invoiceId } });
        if (invoice) {
          const paidTotal = invoicePayments._sum.amountCents ?? 0;
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: paidTotal >= invoice.totalCents ? InvoiceStatus.PAID : InvoiceStatus.ISSUED },
          });
        }
      }

      return createdPayment;
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.PAYMENT_CREATED,
      entityType: 'payment',
      entityId: payment.id,
      metadata: { amountCents: payment.amountCents, method: payment.method },
    });

    // Send payment receipt email (non-blocking)
    if (payment.status === PaymentStatus.PAID && dto.customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId }, select: { email: true, firstName: true, lastName: true } });
      const invoice = dto.invoiceId ? await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId }, select: { invoiceNumber: true } }) : null;
      const tenant = await this.prisma.tenant.findUnique({ where: { id: actor.tenantId }, select: { name: true } });
      if (customer?.email) {
        this.mailer.sendPaymentReceipt({
          toEmail: customer.email,
          customerName: `${customer.firstName} ${customer.lastName}`,
          invoiceNumber: invoice?.invoiceNumber ?? payment.id,
          amountCents: payment.amountCents,
          paymentMethod: payment.method,
          paidAt: payment.paidAt ?? new Date(),
          tenantName: tenant?.name ?? 'FleetRent Pro',
        });
      }
    }

    return payment;
  }

  async sendInvoiceEmail(actor: AuthenticatedUser, invoiceId: string, mailer: MailerService) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: actor.tenantId },
      include: {
        rental: { include: { customer: { select: { email: true, firstName: true, lastName: true } } } },
        tenant: { select: { name: true } },
      },
    });

    if (!invoice) throw new Error('Invoice not found');
    const customer = invoice.rental?.customer;
    if (!customer?.email) throw new Error('Customer has no email address');

    await mailer.sendInvoiceEmail({
      toEmail: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tenantId: actor.tenantId,
      totalAmountCents: invoice.totalCents,
      tenantName: invoice.tenant.name,
    });

    return { sent: true, toEmail: customer.email };
  }
}
