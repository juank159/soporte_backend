import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a base64 image to Cloudinary.
   * Returns the secure URL of the uploaded image.
   */
  async uploadBase64(
    base64Data: string,
    folder: string,
    fileName?: string,
  ): Promise<string> {
    try {
      // Ensure it has the data URI prefix
      let data = base64Data;
      if (!data.startsWith('data:')) {
        data = `data:image/jpeg;base64,${data}`;
      }

      const result = await cloudinary.uploader.upload(data, {
        folder,
        public_id: fileName,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 1280, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      });

      this.logger.log(`Uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      // Return the base64 as fallback (backward compatible)
      return base64Data;
    }
  }

  /**
   * Upload a signature (smaller, no heavy transformations)
   */
  async uploadSignature(
    base64Data: string,
    folder: string,
    fileName?: string,
  ): Promise<string> {
    try {
      let data = base64Data;
      if (!data.startsWith('data:')) {
        data = `data:image/png;base64,${data}`;
      }

      const result = await cloudinary.uploader.upload(data, {
        folder,
        public_id: fileName,
        overwrite: true,
        resource_type: 'image',
      });

      return result.secure_url;
    } catch (error) {
      this.logger.error(`Signature upload failed: ${error.message}`);
      return base64Data;
    }
  }
}
