import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from '@node-rs/bcrypt';
import { UserRoleCode } from '@fleetrent/shared-types';
import type { StringValue } from 'ms';
import { AuditActionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    const validPassword = await compare(password, user.passwordHash);
    if (!validPassword) {
      return null;
    }

    const permissions = await this.usersService.getRolePermissions(user.role.code as UserRoleCode);
    return {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role.code as UserRoleCode,
      permissions,
    } satisfies AuthenticatedUser;
  }

  async login(user: AuthenticatedUser, meta?: { ipAddress?: string; userAgent?: string }) {
    const accessToken = await this.jwtService.signAsync(user, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access-secret'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m') as StringValue,
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.sub, tenantId: user.tenantId, email: user.email },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d') as StringValue,
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        tenantId: user.tenantId,
        userId: user.sub,
        tokenHash: await hash(refreshToken, 12),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });

    await this.prisma.user.update({
      where: { id: user.sub },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.sub,
      actionType: AuditActionType.AUTH_LOGIN,
      entityType: 'auth',
      metadata: { email: user.email },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return { accessToken, refreshToken, user };
  }

  async refresh(refreshToken: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const decoded = await this.jwtService.verifyAsync<{ sub: string; tenantId: string; email: string }>(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
    });

    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: decoded.sub,
        tenantId: decoded.tenantId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const matchedToken = await (async () => {
      for (const tokenRecord of tokens) {
        if (await compare(refreshToken, tokenRecord.tokenHash)) {
          return tokenRecord;
        }
      }
      return null;
    })();

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    const permissions = await this.usersService.getRolePermissions(user.role.code as UserRoleCode);
    const authUser: AuthenticatedUser = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role.code as UserRoleCode,
      permissions,
    };

    await this.auditService.log({
      tenantId: authUser.tenantId,
      userId: authUser.sub,
      actionType: AuditActionType.AUTH_REFRESH,
      entityType: 'auth',
      metadata: { email: authUser.email },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.login(authUser, meta);
  }

  async logout(user: AuthenticatedUser, refreshToken?: string, meta?: { ipAddress?: string; userAgent?: string }) {
    if (refreshToken) {
      const tokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: user.sub,
          tenantId: user.tenantId,
          revokedAt: null,
        },
      });

      for (const tokenRecord of tokens) {
        if (await compare(refreshToken, tokenRecord.tokenHash)) {
          await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() },
          });
        }
      }
    }

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.sub,
      actionType: AuditActionType.AUTH_LOGOUT,
      entityType: 'auth',
      metadata: { email: user.email },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return { success: true };
  }
}
