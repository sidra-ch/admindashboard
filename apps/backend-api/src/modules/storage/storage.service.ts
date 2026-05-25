import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client | null = null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('AWS_S3_BUCKET', '');
    this.region = config.get<string>('AWS_REGION', 'ap-southeast-2');
    const keyId = config.get<string>('AWS_ACCESS_KEY_ID', '');
    const secret = config.get<string>('AWS_SECRET_ACCESS_KEY', '');

    this.configured = !!(this.bucket && keyId && secret);

    if (this.configured) {
      this.s3 = new S3Client({
        region: this.region,
        credentials: { accessKeyId: keyId, secretAccessKey: secret },
      });
      this.logger.log('S3 storage configured');
    } else {
      this.logger.warn('S3 not configured — file uploads will return stub URLs');
    }
  }

  /**
   * Generate a presigned POST URL so the browser can upload directly to S3.
   * Returns a stub response if S3 is not configured (dev mode).
   */
  async getPresignedUpload(opts: {
    tenantId: string;
    entityType: string;
    entityId: string;
    filename: string;
    mimeType: string;
    maxSizeMb?: number;
  }): Promise<{ url: string; fields: Record<string, string>; fileKey: string; fileUrl: string }> {
    const ext = opts.filename.split('.').pop() ?? 'bin';
    const fileKey = `${opts.tenantId}/${opts.entityType}/${opts.entityId}/${randomUUID()}.${ext}`;

    if (!this.configured || !this.s3) {
      // Dev stub — return a fake URL
      const stubUrl = `https://${this.bucket || 'fleetrent-dev'}.s3.${this.region}.amazonaws.com/${fileKey}`;
      return { url: 'https://stub.invalid', fields: {}, fileKey, fileUrl: stubUrl };
    }

    const { url, fields } = await createPresignedPost(this.s3, {
      Bucket: this.bucket,
      Key: fileKey,
      Conditions: [
        { bucket: this.bucket },
        ['starts-with', '$Content-Type', opts.mimeType.split('/')[0]],
        ['content-length-range', 1, (opts.maxSizeMb ?? 20) * 1024 * 1024],
      ],
      Fields: { 'Content-Type': opts.mimeType },
      Expires: 300, // 5 minutes
    });

    const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;
    return { url, fields, fileKey, fileUrl };
  }

  async deleteFile(fileKey: string): Promise<void> {
    if (!this.configured || !this.s3) return;
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }));
    } catch (err) {
      this.logger.error(`Failed to delete S3 object ${fileKey}`, err);
    }
  }
}
