import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      rentalId: string;
      customerId: string;
      amountCents: number;
      invoiceId?: string;
      description?: string;
      customerEmail?: string;
      successUrl: string;
      cancelUrl: string;
    },
  ) {
    return this.stripeService.createCheckoutSession({
      ...body,
      tenantId: user.tenantId,
    });
  }

  /** Stripe calls this with raw body — NO JwtAuthGuard */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req.rawBody!, signature);
  }
}
