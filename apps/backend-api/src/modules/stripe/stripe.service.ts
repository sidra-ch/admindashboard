import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';

type StripeInstance = InstanceType<typeof Stripe>;

@Injectable()
export class StripeService {
  private readonly stripe: StripeInstance;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.config.get<string>('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
      { apiVersion: '2026-05-27.dahlia' },
    );
  }

  async createCheckoutSession(data: {
    rentalId: string;
    customerId: string;
    tenantId: string;
    amountCents: number;
    invoiceId?: string;
    customerEmail?: string;
    description?: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    if (data.amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      ...(data.customerEmail ? { customer_email: data.customerEmail } : {}),
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: { name: data.description ?? 'Rental Payment' },
            unit_amount: data.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        rentalId: data.rentalId,
        customerId: data.customerId,
        tenantId: data.tenantId,
        invoiceId: data.invoiceId ?? '',
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<{ received: boolean }> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: { type: string; data: { object: any } };
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret) as typeof event;
    } catch (err) {
      this.logger.warn(`Stripe webhook signature verification failed: ${err}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        id: string;
        amount_total: number | null;
        metadata: Record<string, string> | null;
      };
      const { rentalId, customerId, tenantId, invoiceId } = session.metadata ?? {};

      if (rentalId && customerId && tenantId) {
        try {
          const amountCents = session.amount_total ?? 0;

          await this.prisma.$transaction(async (tx) => {
            await tx.payment.create({
              data: {
                tenantId,
                rentalId,
                customerId,
                invoiceId: invoiceId || null,
                amountCents,
                method: 'STRIPE',
                status: 'PAID',
                reference: session.id,
                paidAt: new Date(),
              },
            });

            const rental = await tx.rental.findUnique({ where: { id: rentalId } });
            if (rental) {
              const balanceDueCents = Math.max(0, rental.balanceDueCents - amountCents);
              await tx.rental.update({ where: { id: rental.id }, data: { balanceDueCents } });
            }
          });

          this.logger.log(`Stripe payment recorded: rentalId=${rentalId} amount=${amountCents}`);
        } catch (err) {
          this.logger.error('Failed to record Stripe payment', err);
        }
      }
    }

    return { received: true };
  }
}
