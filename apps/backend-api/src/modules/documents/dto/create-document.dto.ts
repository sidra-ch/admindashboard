import { IsEnum, IsOptional, IsString, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '@prisma/client';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  carId?: string;

  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  name!: string;

  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  fileSizeBytes?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
