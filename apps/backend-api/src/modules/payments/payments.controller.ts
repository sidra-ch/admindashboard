import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { PermissionCode } from '@fleetrent/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { PaymentsService } from './payments.service';
import { PdfService } from '../pdf/pdf.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @Permissions(PermissionCode.PAYMENT_READ)
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListPaymentsQueryDto) {
    return this.paymentsService.listForTenant(user.tenantId, query);
  }

  @Get('revenue-summary')
  @Permissions(PermissionCode.PAYMENT_READ)
  async getRevenueSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getRevenueSummary(user.tenantId);
  }

  @Post()
  @Permissions(PermissionCode.PAYMENT_WRITE)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user, dto);
  }

  @Get('invoices/:id/pdf')
  @Permissions(PermissionCode.PAYMENT_READ)
  async downloadInvoicePdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.pdfService.generateInvoice(id, user.tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id.slice(0, 8)}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
