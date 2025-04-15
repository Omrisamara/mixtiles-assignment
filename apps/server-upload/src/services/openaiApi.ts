import { Embedding, ImageVisionDescription } from '../imageProcessor.js';
import { encoding_for_model } from '@dqbd/tiktoken';
import axios from 'axios';
import { ClusteringResult } from './clusterApi.js';

// Define the cluster description type for internal use
interface ClusterGroup {
  clusterId: number;
  filenames: string[];
}

export class OpenaiApi {
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly CHAT_MODEL = 'gpt-4-turbo';
  private readonly MAX_TOKENS_PER_BATCH = 8191; // OpenAI's limit for this model
  
  constructor(private apiKey: string) {}

  /**
   * Creates optimized batches of descriptions based on token count
   */
  private createBatches(descriptions: ImageVisionDescription[]): ImageVisionDescription[][] {
    // Get the tiktoken encoder to count tokens
    const encoder = encoding_for_model(this.EMBEDDING_MODEL);
    
    // Create batches based on token count
    const batches: ImageVisionDescription[][] = [];
    let currentBatch: ImageVisionDescription[] = [];
    let currentBatchTokens = 0;
    
    for (const description of descriptions) {
      const tokens = encoder.encode(description.description).length;
      
      // If adding this description would exceed the token limit, start a new batch
      if (currentBatchTokens + tokens > this.MAX_TOKENS_PER_BATCH) {
        if (currentBatch.length > 0) {
          batches.push(currentBatch);
        }
        currentBatch = [description];
        currentBatchTokens = tokens;
      } else {
        currentBatch.push(description);
        currentBatchTokens += tokens;
      }
    }
    
    // Add the last batch if it's not empty
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    
    // Free the encoder to prevent memory leaks
    encoder.free();
    
    return batches;
  }

  /**
   * Processes a single batch of descriptions to get embeddings
   */
  private async processBatch(batch: ImageVisionDescription[]): Promise<Embedding[]> {
    const batchTexts = batch.map(desc => desc.description);
    
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: this.EMBEDDING_MODEL,
        input: batchTexts,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Map response embeddings back to their original filenames
    return response.data.data.map((item: any, index: number) => ({
      filename: batch[index].filename,
      vector: item.embedding,
    }));
  }

  async getEmbddings(descriptions: ImageVisionDescription[]): Promise<Embedding[]> {
    // Create batches
    const batches = this.createBatches(descriptions);
    
    // Process all batches in parallel
    const batchResults = await Promise.all(
      batches.map(batch => this.processBatch(batch))
    );
    
    // Flatten the results from all batches
    return batchResults.flat();
  }

  /**
   * Organizes clustered descriptions into groups by cluster ID
   */
  private organizeClusterGroups(
    clusteringResult: ClusteringResult,
    imagesVisionDescriptions: ImageVisionDescription[]
  ): ClusterGroup[] {
    // Create a map of filenames to their descriptions
    const filenameToDescription = new Map<string, string>();
    imagesVisionDescriptions.forEach(desc => {
      filenameToDescription.set(desc.filename, desc.description);
    });
    
    // Group files by cluster ID
    const clusterGroups = new Map<number, string[]>();
    
    clusteringResult.fileClusterMapping.forEach((mapping: { cluster: number; fileId: string }) => {
      const clusterId = mapping.cluster;
      const filename = mapping.fileId;
      
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, []);
      }
      
      clusterGroups.get(clusterId)?.push(filename);
    });
    
    // Convert the map to an array of ClusterGroup objects
    return Array.from(clusterGroups.entries()).map(([clusterId, filenames]) => ({
      clusterId,
      filenames
    }));
  }

  /**
   * Generates cluster names by sending descriptions to OpenAI
   */
  async createClusterNames(
    clusteringResult: ClusteringResult, 
    imagesVisionDescriptions: ImageVisionDescription[]
  ): Promise<Map<number, string>> {
    const results = new Map<number, string>();
    
    // Import p-retry for retrying failed requests
    const pRetryModule = await import('p-retry');
    const retry = pRetryModule.default;
    
    // Organize descriptions into cluster groups
    const clusterGroups = this.organizeClusterGroups(clusteringResult, imagesVisionDescriptions);
    
    // Create a map of filenames to their descriptions
    const filenameToDescription = new Map<string, string>();
    imagesVisionDescriptions.forEach(desc => {
      filenameToDescription.set(desc.filename, desc.description);
    });
    
    // Process each cluster
    for (const cluster of clusterGroups) {
      // Get descriptions for all images in this cluster
      const clusterDescriptions = cluster.filenames
        .map(filename => filenameToDescription.get(filename) || '')
        .filter(description => description !== '');
      
      // Skip empty clusters
      if (clusterDescriptions.length === 0) {
        results.set(cluster.clusterId, `Cluster ${cluster.clusterId}`);
        continue;
      }
      
      // Join descriptions into a single string (limit to prevent token overflow)
      const descriptionsText = clusterDescriptions.slice(0, 10).join("\n");
      
      // Create function for API call with retry
      const generateClusterName = async () => {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: this.CHAT_MODEL,
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that creates short, descriptive labels for image narratives (like google photos albums)."
              },
              {
                role: "user",
                content: `Based on the following image descriptions, create a concise label (important: maximum 4 words) that best describes this group of images:\n\n${descriptionsText}`
              }
            ],
            max_tokens: 20,
            temperature: 0.4
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        return response.data.choices[0].message.content.trim();
      };
      
      try {
        // Execute request with exponential backoff retry
        const label = await retry(generateClusterName, {
          retries: 3,
          onFailedAttempt: (error) => {
            console.warn(`Cluster naming attempt failed for cluster ${cluster.clusterId}. ${error.message}. Retrying...`);
          },
          minTimeout: 1000, // Start with 1 second delay
          factor: 2 // Exponential factor for backoff
        });
        
        // Add to results
        results.set(cluster.clusterId, label);
      } catch (error) {
        console.error(`Error generating label for cluster ${cluster.clusterId} after retries:`, error);
        
        // Add a fallback label if API call fails
        results.set(cluster.clusterId, `Cluster ${cluster.clusterId}`);
      }
    }
    
    return results;
  }

  async getRelevantClusters(clusterLabelsMap: Map<number, string>): Promise<number[]> {
    // Convert map to array of cluster descriptions
    const clusters = Array.from(clusterLabelsMap.entries()).map(([id, label]) => ({
      id,
      label
    }));

    // Skip if no clusters
    if (clusters.length === 0) {
      return [];
    }

    const clustersText = clusters.map(c => `Cluster ${c.id}: ${c.label}`).join('\n');
    console.log("All Clusters text: ", clustersText)

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.CHAT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a photo curator AI that helps select meaningful and interesting photo clusters for personalized albums. Select clusters that would create engaging and memorable experiences."
            },
            {
              role: "user",
              content: `Below are photo cluster labels. Select ONLY the cluster IDs (just the numbers) that would make for interesting and meaningful personal album experiences. Return ONLY a comma-separated list of cluster IDs, nothing else.\n\n${clustersText}`
              // content: `Below are photo cluster labels. Select ONLY the cluster IDs (just the numbers) that would make for interesting and meaningful personal album experiences. Consider factors like events, landmarks, activities, or emotionally significant moments. Return ONLY a comma-separated list of cluster IDs, nothing else.\n\n${clustersText}`
            }
          ],
          max_tokens: 100,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices[0].message.content.trim();
      
      // Parse the comma-separated response into an array of numbers
      return result.split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id) && clusterLabelsMap.has(id));

    } catch (error) {
      console.error('Error selecting relevant clusters:', error);
      // On error, return all cluster IDs as fallback
      return Array.from(clusterLabelsMap.keys());
    }
  }
} 