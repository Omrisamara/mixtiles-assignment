import { ImageVisionDescription } from '../imageProcessor.js';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as fs from 'fs';
import * as path from 'path';

export class GoogleVisionApi {
  private client: ImageAnnotatorClient;
  private batchSize = 16; // Google Vision API allows up to 16 images per request

  constructor(private serviceAccountJson: object) {
    // Initialize the client using the service account JSON directly
    this.client = new ImageAnnotatorClient({
      credentials: this.serviceAccountJson
    });
  }

  async getDescriptions(files: Express.Multer.File[]): Promise<ImageVisionDescription[]> {
    try {
      // Split files into batches
      const batches = this.splitIntoBatches(files, this.batchSize);
      
      // Dynamically import PQueue
      const { default: PQueue } = await import('p-queue');
      
      // Create queue with rate limiting (2 requests per second)
      const queue = new PQueue({
        interval: 500, // 1 second
        intervalCap: 5, // 2 tasks per interval
        concurrency: 1  // Process 2 tasks at a time
      });
      
      // Add all batches to the queue and collect promises
      const promises: Promise<ImageVisionDescription[]>[] = [];
      
      for (const batch of batches) {
        const promise = queue.add(async () => {
          const result = await this.processBatch(batch);
          return result;
        });
        promises.push(promise as Promise<ImageVisionDescription[]>);
      }
      
      // Wait for all batches to complete
      const batchResults = await Promise.all(promises);
      
      // Flatten results
      return batchResults.flat();
    } catch (error) {
      console.error('Error in getDescriptions:', error);
      throw error;
    }
  }

  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(files: Express.Multer.File[]): Promise<ImageVisionDescription[]> {
    // Prepare requests for the batch
    const requests = files.map(file => ({
      image: {
        content: file.buffer.toString('base64')
      },
      features: [
        { type: 'LABEL_DETECTION' as const, maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION' as const, maxResults: 10 },
        { type: 'LANDMARK_DETECTION' as const, maxResults: 5 }
      ]
    }));

    // Process with retry
    const processWithRetry = async () => {
      const [result] = await this.client.batchAnnotateImages({ requests });
      return result;
    };

    try {
      // Dynamically import p-retry
      const pRetryModule = await import('p-retry');
      const retry = pRetryModule.default;
      
      // Execute request with exponential backoff retry
      const batchResult = await retry(processWithRetry, {
        retries: 1,
        onFailedAttempt: (error: Error) => {
          console.warn(`Batch processing attempt failed. ${error.message}. Retrying...`);
          console.log(error)
        },
        minTimeout: 10000, // Start with 1 second delay
        factor: 1 // Exponential factor for backoff
      });

      // Map results to our desired format
      return files.map((file, index) => {
        const response = batchResult?.responses?.[index] || {};
        
        // Combine different annotation types for rich description
        let description = '';
        
        if (response.labelAnnotations && response.labelAnnotations.length > 0) {
          const labels = response.labelAnnotations
            .slice(0, 10)
            .map((label: any) => label.description as string)
            .filter(Boolean)
            .join(', ');
          
          description += `Labels: ${labels}. `;
        }
        
        if (response.landmarkAnnotations && response.landmarkAnnotations.length > 0) {
          const landmark = response.landmarkAnnotations[0].description;
          description += `Landmark: ${landmark}. `;
        }
        
        if (response.localizedObjectAnnotations && response.localizedObjectAnnotations.length > 0) {
          const objects = response.localizedObjectAnnotations
            .slice(0, 10)
            .map((obj: any) => obj.name as string)
            .filter(Boolean)
            .join(', ');
          
          description += `Objects: ${objects}.`;
        }
        
        // Fallback if no descriptions were found
        if (!description) {
          description = 'No description available';
        }
        
        return {
          filename: file.originalname,
          description: description.trim()
        };
      });
    } catch (error) {
      console.error('Failed to process batch after retries:', error);
      // Return basic descriptions for failed batch
      return files.map(file => ({
        filename: file.originalname,
        description: 'Failed to analyze image'
      }));
    }
  }
}