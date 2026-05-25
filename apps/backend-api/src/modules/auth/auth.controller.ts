import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(dto.refreshToken, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: Partial<RefreshTokenDto>,
    @Req() request: Request,
  ) {
    return this.authService.logout(user, dto.refreshToken, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }
}
