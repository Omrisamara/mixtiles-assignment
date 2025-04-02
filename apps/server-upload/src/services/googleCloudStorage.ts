import { Storage } from '@google-cloud/storage';

export class GoogleCloudStorage {
  private storage: Storage;
  private bucketName: string;

  constructor(bucketName: string, credentials?: any) {
    this.storage = new Storage(credentials ? { credentials } : undefined);
    this.bucketName = bucketName;
  }

  async saveImages(files: Express.Multer.File[]): Promise<Record<string, string>> {
    const fileUrlMap: Record<string, string> = {};
    const bucket = this.storage.bucket(this.bucketName);

    const savePromises = files.map(async (file) => {
      try {
        const blob = bucket.file(file.originalname);
        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: file.mimetype,
        });

        return new Promise<void>((resolve, reject) => {
          blobStream.on('error', (err: Error) => {
            reject(err);
          });

          blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            fileUrlMap[file.originalname] = publicUrl;
            resolve();
          });

          blobStream.end(file.buffer);
        });
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        throw error;
      }
    });

    // Implement retry mechanism
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await Promise.all(savePromises);
        break;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          console.error('Max retries reached for uploading files');
          throw error;
        }
        console.log(`Retry attempt ${retries} for uploading files`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    return fileUrlMap;
  }
} 