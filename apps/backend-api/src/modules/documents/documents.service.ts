import { Injectable } from '@nestjs/common';
import { AuditActionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(tenantId: string, entityType?: string, entityId?: string) {
    return this.prisma.document.findMany({
      where: {
        tenantId,
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async create(actor: AuthenticatedUser, dto: CreateDocumentDto) {
    const doc = await this.prisma.document.create({
      data: {
        tenantId: actor.tenantId,
        carId: dto.carId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        type: dto.type,
        name: dto.name,
        fileUrl: dto.fileUrl,
        fileSizeBytes: dto.fileSizeBytes ?? 0,
        mimeType: dto.mimeType,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      actionType: AuditActionType.DOCUMENT_UPLOADED,
      entityType: dto.entityType,
      entityId: dto.entityId,
      metadata: { name: dto.name, type: dto.type },
    });

    return doc;
  }

  async delete(actor: AuthenticatedUser, id: string) {
    return this.prisma.document.deleteMany({ where: { id, tenantId: actor.tenantId } });
  }

  async getExpiringSoon(tenantId: string, days = 30) {
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.prisma.document.findMany({
      where: { tenantId, expiresAt: { lte: cutoff, gt: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });
  }
}
