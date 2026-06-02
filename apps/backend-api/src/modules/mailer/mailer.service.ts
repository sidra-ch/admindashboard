import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly pdfService: PdfService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromEmail = this.config.get<string>('MAIL_FROM_EMAIL', 'noreply@fleetrent.app');
    this.fromName = this.config.get<string>('MAIL_FROM_NAME', 'FleetRent Pro');
    this.enabled = !!apiKey;

    if (this.enabled) {
      this.resend = new Resend(apiKey);
      this.logger.log('Mailer service initialized with Resend');
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails disabled (set it in .env to enable)');
    }
  }

  private get from() {
    return `${this.fromName} <${this.fromEmail}>`;
  }

  // ─────────────────────────────────────────────────────────────────
  // Public send methods
  // ─────────────────────────────────────────────────────────────────

  async sendRentalConfirmation(opts: {
    toEmail: string;
    customerName: string;
    invoiceNumber: string;
    carName: string;
    registrationNumber: string;
    pickupAt: Date;
    expectedReturnAt: Date;
    totalAmountCents: number;
    tenantName: string;
  }) {
    const subject = `Rental Confirmation — ${opts.invoiceNumber}`;
    const html = this.buildRentalConfirmationHtml(opts);
    await this.send(opts.toEmail, subject, html);
  }

  async sendInvoiceEmail(opts: {
    toEmail: string;
    customerName: string;
    invoiceId: string;
    invoiceNumber: string;
    tenantId: string;
    totalAmountCents: number;
    tenantName: string;
  }) {
    const subject = `Invoice ${opts.invoiceNumber} — ${opts.tenantName}`;

    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await this.pdfService.generateInvoice(opts.invoiceId, opts.tenantId);
    } catch (err) {
      this.logger.error('Failed to generate invoice PDF for email', err);
    }

    const html = this.buildInvoiceHtml(opts);
    await this.send(
      opts.toEmail,
      subject,
      html,
      pdfBuffer
        ? [{ filename: `Invoice-${opts.invoiceNumber}.pdf`, content: pdfBuffer }]
        : undefined,
    );
  }

  async sendPaymentReceipt(opts: {
    toEmail: string;
    customerName: string;
    invoiceNumber: string;
    amountCents: number;
    paymentMethod: string;
    paidAt: Date;
    tenantName: string;
  }) {
    const subject = `Payment Receipt — ${opts.invoiceNumber}`;
    const html = this.buildPaymentReceiptHtml(opts);
    await this.send(opts.toEmail, subject, html);
  }

  async sendOverdueReminder(opts: {
    toEmail: string;
    customerName: string;
    carName: string;
    registrationNumber: string;
    expectedReturnAt: Date;
    daysOverdue: number;
    balanceDueCents: number;
    tenantName: string;
  }) {
    const subject = `⚠️ Overdue Return Reminder — ${opts.carName}`;
    const html = this.buildOverdueHtml(opts);
    await this.send(opts.toEmail, subject, html);
  }

  async sendMaintenanceDue(opts: {
    toEmail: string;
    carName: string;
    registrationNumber: string;
    nextServiceDate: Date;
    tenantName: string;
  }) {
    const subject = `Maintenance Due — ${opts.carName} (${opts.registrationNumber})`;
    const html = this.buildMaintenanceDueHtml(opts);
    await this.send(opts.toEmail, subject, html);
  }

  // ─────────────────────────────────────────────────────────────────
  // Core send
  // ─────────────────────────────────────────────────────────────────

  private async send(
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; content: Buffer }[],
  ) {
    if (!this.enabled || !this.resend) {
      this.logger.debug(`[Email disabled] Would send "${subject}" to ${to}`);
      return;
    }

    try {
      const payload: Parameters<Resend['emails']['send']>[0] = {
        from: this.from,
        to,
        subject,
        html,
        ...(attachments?.length
          ? {
              attachments: attachments.map((a) => ({
                filename: a.filename,
                content: a.content,
              })),
            }
          : {}),
      };

      const result = await this.resend.emails.send(payload);
      this.logger.log(`Email sent: "${subject}" → ${to} (id=${result.data?.id ?? 'n/a'})`);
    } catch (err) {
      // Non-fatal — log but never crash the main flow
      this.logger.error(`Failed to send email "${subject}" to ${to}`, err);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // HTML Templates
  // ─────────────────────────────────────────────────────────────────

  private layout(content: string, tenantName: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Email</title>
<style>
  body { margin:0; padding:0; background:#0B1020; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width:600px; margin:0 auto; padding:32px 16px; }
  .card { background:#121A2F; border-radius:16px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; }
  .header { background:linear-gradient(135deg,rgba(77,162,255,0.18) 0%,rgba(18,26,47,1) 100%); padding:32px 32px 24px; border-bottom:1px solid rgba(255,255,255,0.08); }
  .logo { color:#4DA2FF; font-size:20px; font-weight:700; letter-spacing:-0.03em; margin:0 0 4px; }
  .header-sub { color:#A8B3CF; font-size:13px; margin:0; }
  .body { padding:32px; }
  .h1 { color:#F5F7FA; font-size:22px; font-weight:700; letter-spacing:-0.02em; margin:0 0 8px; }
  .lead { color:#A8B3CF; font-size:14px; line-height:1.6; margin:0 0 24px; }
  .info-box { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; margin-bottom:24px; }
  .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
  .row:last-child { border-bottom:none; }
  .label { color:#6E7A99; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; }
  .value { color:#F5F7FA; font-size:13px; font-weight:500; text-align:right; }
  .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }
  .badge-success { background:rgba(0,194,122,0.15); color:#00C27A; border:1px solid rgba(0,194,122,0.25); }
  .badge-warning { background:rgba(255,181,71,0.15); color:#FFB547; border:1px solid rgba(255,181,71,0.25); }
  .badge-danger  { background:rgba(255,90,111,0.15); color:#FF5A6F; border:1px solid rgba(255,90,111,0.25); }
  .btn { display:inline-block; padding:12px 24px; border-radius:10px; font-size:14px; font-weight:600; text-decoration:none; color:#fff; background:#4DA2FF; }
  .total-row { background:rgba(77,162,255,0.08); border-radius:8px; padding:12px 16px; display:flex; justify-content:space-between; margin-top:8px; }
  .total-label { color:#A8B3CF; font-size:13px; font-weight:600; }
  .total-value { color:#4DA2FF; font-size:18px; font-weight:700; }
  .footer { padding:24px 32px; border-top:1px solid rgba(255,255,255,0.06); text-align:center; }
  .footer p { color:#6E7A99; font-size:11px; margin:0; line-height:1.6; }
  @media(max-width:480px){ .body,.header,.footer{padding:20px;} .h1{font-size:18px;} }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <p class="logo">⚡ ${tenantName}</p>
      <p class="header-sub">Fleet Management System</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>This email was sent by ${tenantName} via FleetRent Pro.<br/>
      Please do not reply to this email.</p>
    </div>
  </div>
</div>
</body>
</html>`;
  }

  private buildRentalConfirmationHtml(opts: {
    customerName: string;
    invoiceNumber: string;
    carName: string;
    registrationNumber: string;
    pickupAt: Date;
    expectedReturnAt: Date;
    totalAmountCents: number;
    tenantName: string;
  }) {
    const fmt = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    const currency = (c: number) => `$${(c / 100).toFixed(2)}`;

    const content = `
      <h1 class="h1">Rental Confirmed ✓</h1>
      <p class="lead">Hi ${opts.customerName}, your rental has been confirmed. Please keep this email as your reference.</p>
      <div class="info-box">
        <div class="row"><span class="label">Reference</span><span class="value">${opts.invoiceNumber}</span></div>
        <div class="row"><span class="label">Vehicle</span><span class="value">${opts.carName}</span></div>
        <div class="row"><span class="label">Plate</span><span class="value">${opts.registrationNumber}</span></div>
        <div class="row"><span class="label">Pickup Date</span><span class="value">${fmt(opts.pickupAt)}</span></div>
        <div class="row"><span class="label">Return Date</span><span class="value">${fmt(opts.expectedReturnAt)}</span></div>
      </div>
      <div class="total-row">
        <span class="total-label">Total Amount</span>
        <span class="total-value">${currency(opts.totalAmountCents)}</span>
      </div>
    `;
    return this.layout(content, opts.tenantName);
  }

  private buildInvoiceHtml(opts: {
    customerName: string;
    invoiceNumber: string;
    totalAmountCents: number;
    tenantName: string;
  }) {
    const currency = (c: number) => `$${(c / 100).toFixed(2)}`;

    const content = `
      <h1 class="h1">Your Invoice is Ready</h1>
      <p class="lead">Hi ${opts.customerName}, please find your invoice attached to this email.</p>
      <div class="info-box">
        <div class="row"><span class="label">Invoice Number</span><span class="value">${opts.invoiceNumber}</span></div>
        <div class="row"><span class="label">Issued By</span><span class="value">${opts.tenantName}</span></div>
      </div>
      <div class="total-row">
        <span class="total-label">Amount Due</span>
        <span class="total-value">${currency(opts.totalAmountCents)}</span>
      </div>
      <p style="color:#6E7A99;font-size:12px;margin-top:16px;">
        The invoice PDF is attached to this email. Please contact us if you have any questions.
      </p>
    `;
    return this.layout(content, opts.tenantName);
  }

  private buildPaymentReceiptHtml(opts: {
    customerName: string;
    invoiceNumber: string;
    amountCents: number;
    paymentMethod: string;
    paidAt: Date;
    tenantName: string;
  }) {
    const currency = (c: number) => `$${(c / 100).toFixed(2)}`;
    const fmt = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    const content = `
      <h1 class="h1">Payment Received ✓</h1>
      <p class="lead">Hi ${opts.customerName}, we have received your payment. Thank you!</p>
      <div class="info-box">
        <div class="row"><span class="label">Invoice</span><span class="value">${opts.invoiceNumber}</span></div>
        <div class="row"><span class="label">Payment Method</span><span class="value">${opts.paymentMethod}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${fmt(opts.paidAt)}</span></div>
      </div>
      <div class="total-row">
        <span class="total-label">Amount Paid</span>
        <span class="total-value">${currency(opts.amountCents)}</span>
      </div>
    `;
    return this.layout(content, opts.tenantName);
  }

  private buildOverdueHtml(opts: {
    customerName: string;
    carName: string;
    registrationNumber: string;
    expectedReturnAt: Date;
    daysOverdue: number;
    balanceDueCents: number;
    tenantName: string;
  }) {
    const currency = (c: number) => `$${(c / 100).toFixed(2)}`;
    const fmt = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    const content = `
      <h1 class="h1">⚠️ Overdue Vehicle Return</h1>
      <p class="lead">Hi ${opts.customerName}, your rental vehicle is <strong style="color:#FF5A6F">${opts.daysOverdue} day${opts.daysOverdue !== 1 ? 's' : ''} overdue</strong>. Please return it as soon as possible.</p>
      <div class="info-box">
        <div class="row"><span class="label">Vehicle</span><span class="value">${opts.carName}</span></div>
        <div class="row"><span class="label">Plate</span><span class="value">${opts.registrationNumber}</span></div>
        <div class="row"><span class="label">Was Due</span><span class="value">${fmt(opts.expectedReturnAt)}</span></div>
        <div class="row"><span class="label">Days Overdue</span><span class="value"><span class="badge badge-danger">${opts.daysOverdue} days</span></span></div>
      </div>
      <div class="total-row">
        <span class="total-label">Balance Due</span>
        <span class="total-value" style="color:#FF5A6F">${currency(opts.balanceDueCents)}</span>
      </div>
      <p style="color:#6E7A99;font-size:12px;margin-top:16px;">
        Additional late fees may apply. Please contact us immediately to arrange the return.
      </p>
    `;
    return this.layout(content, opts.tenantName);
  }

  private buildMaintenanceDueHtml(opts: {
    carName: string;
    registrationNumber: string;
    nextServiceDate: Date;
    tenantName: string;
  }) {
    const fmt = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    const content = `
      <h1 class="h1">🔧 Maintenance Due Reminder</h1>
      <p class="lead">The following vehicle is due for scheduled maintenance.</p>
      <div class="info-box">
        <div class="row"><span class="label">Vehicle</span><span class="value">${opts.carName}</span></div>
        <div class="row"><span class="label">Plate</span><span class="value">${opts.registrationNumber}</span></div>
        <div class="row"><span class="label">Service Due</span><span class="value"><span class="badge badge-warning">${fmt(opts.nextServiceDate)}</span></span></div>
      </div>
      <p style="color:#6E7A99;font-size:12px;margin-top:16px;">
        Please schedule this vehicle for servicing to avoid operational disruptions.
      </p>
    `;
    return this.layout(content, opts.tenantName);
  }
}
