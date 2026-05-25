import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoice(invoiceId: string, tenantId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        rental: {
          include: {
            car: true,
            customer: true,
          },
        },
        payments: true,
        tenant: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tenant = invoice.tenant;
      const customer = invoice.rental?.customer;
      const car = invoice.rental?.car;

      // ── Header ─────────────────────────────────────────────
      doc.fontSize(24).font('Helvetica-Bold').text('TAX INVOICE', { align: 'right' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#555555');
      doc.text(tenant.name, { align: 'right' });
      doc.fillColor('#000000');

      // ── Divider ────────────────────────────────────────────
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
      doc.moveDown(1);

      // ── Invoice Meta ───────────────────────────────────────
      const leftX = 50;
      const rightX = 350;
      const startY = doc.y;

      doc.font('Helvetica-Bold').fontSize(10).text('Invoice Number:', leftX, startY);
      doc.font('Helvetica').text(invoice.invoiceNumber, leftX + 120, startY);

      doc.font('Helvetica-Bold').text('Invoice Date:', leftX, startY + 18);
      doc.font('Helvetica').text(new Date(invoice.issuedAt).toLocaleDateString('en-AU'), leftX + 120, startY + 18);

      doc.font('Helvetica-Bold').text('Due Date:', leftX, startY + 36);
      doc.font('Helvetica').text(invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString('en-AU') : '—', leftX + 120, startY + 36);

      doc.font('Helvetica-Bold').text('Status:', leftX, startY + 54);
      doc.font('Helvetica').fillColor(invoice.status === 'PAID' ? '#16a34a' : '#dc2626')
        .text(invoice.status, leftX + 120, startY + 54);
      doc.fillColor('#000000');

      // ── Bill To ────────────────────────────────────────────
      if (customer) {
        doc.font('Helvetica-Bold').fontSize(10).text('Bill To:', rightX, startY);
        doc.font('Helvetica').text(`${customer.firstName} ${customer.lastName}`, rightX, startY + 18);
        if (customer.email) doc.text(customer.email, rightX, startY + 36);
        if (customer.phone) doc.text(customer.phone, rightX, startY + 54);
      }

      doc.moveDown(5);

      // ── Vehicle Details ────────────────────────────────────
      if (car) {
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(11).text('Rental Details');
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(10);
        doc.text(`Vehicle: ${car.brand} ${car.model} (${car.year}) — ${car.registrationNumber}`);
        if (invoice.rental) {
          const start = new Date(invoice.rental.pickupAt).toLocaleDateString('en-AU');
          const end = invoice.rental.actualReturnAt
            ? new Date(invoice.rental.actualReturnAt).toLocaleDateString('en-AU')
            : 'Ongoing';
          doc.text(`Period: ${start} → ${end}`);
        }
        doc.moveDown(1);
      }

      // ── Line Items Table ───────────────────────────────────
      const tableTop = doc.y;
      doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor('#aaaaaa').stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Description', 50, doc.y, { width: 280 });
      doc.text('Qty', 330, doc.y - 12, { width: 50, align: 'center' });
      doc.text('Unit Price', 380, doc.y - 12, { width: 80, align: 'right' });
      doc.text('Amount', 460, doc.y - 12, { width: 85, align: 'right' });

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#aaaaaa').stroke();
      doc.moveDown(0.5);

      // Rental charge line
      const subtotalCents = invoice.subtotalCents;
      const taxCents = invoice.taxCents;
      const totalCents = invoice.totalCents;

      doc.font('Helvetica').fontSize(10);
      const rowY = doc.y;
      doc.text(`Car Rental — ${car ? `${car.brand} ${car.model}` : 'Vehicle'}`, 50, rowY, { width: 280 });
      doc.text('1', 330, rowY, { width: 50, align: 'center' });
      doc.text(`$${(subtotalCents / 100).toFixed(2)}`, 380, rowY, { width: 80, align: 'right' });
      doc.text(`$${(subtotalCents / 100).toFixed(2)}`, 460, rowY, { width: 85, align: 'right' });

      doc.moveDown(2);

      // ── Totals ─────────────────────────────────────────────
      doc.moveTo(350, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
      doc.moveDown(0.5);

      const totalsY = doc.y;
      doc.font('Helvetica').fontSize(10);
      doc.text('Subtotal:', 350, totalsY, { width: 110 });
      doc.text(`$${(subtotalCents / 100).toFixed(2)}`, 460, totalsY, { width: 85, align: 'right' });

      doc.text('GST (10%):', 350, totalsY + 18, { width: 110 });
      doc.text(`$${(taxCents / 100).toFixed(2)}`, 460, totalsY + 18, { width: 85, align: 'right' });

      doc.moveTo(350, totalsY + 36).lineTo(545, totalsY + 36).strokeColor('#aaaaaa').stroke();

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', 350, totalsY + 42, { width: 110 });
      doc.text(`$${(totalCents / 100).toFixed(2)}`, 460, totalsY + 42, { width: 85, align: 'right' });

      // ── Payments ───────────────────────────────────────────
      if (invoice.payments.length > 0) {
        doc.moveDown(4);
        doc.font('Helvetica-Bold').fontSize(10).text('Payments Received:');
        doc.font('Helvetica').fontSize(10);
        for (const p of invoice.payments) {
          doc.text(
            `${p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-AU') : '—'} — ${p.method} — $${(p.amountCents / 100).toFixed(2)}`,
          );
        }
      }

      // ── Footer ─────────────────────────────────────────────
      doc.fontSize(9).fillColor('#888888')
        .text('Thank you for choosing FleetRent Pro. This is a tax invoice for GST purposes.', 50, 760, {
          align: 'center',
          width: 495,
        });

      doc.end();
    });
  }
}
