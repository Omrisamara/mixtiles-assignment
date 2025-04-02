import { Embedding, ImageTakenLocation, ImageTakenTime } from '../imageProcessor';
import axios from 'axios';

export interface FileClusterMapping {
  fileId: string;
  cluster: number;
}

export interface ClusteringResult {
  fileClusterMapping: FileClusterMapping[];
  outliers: string[];
}

export class ClusterApi {
  constructor(private apiEndpoint: string) {}

  async cluster(
    embeddings: Embedding[],
    imagesTakenTime: ImageTakenTime[],
    imagesTakenLocation: ImageTakenLocation[]
  ): Promise<ClusteringResult> {
    try {
      const response = await axios.post(`${this.apiEndpoint}/cluster`, {
        embeddings,
        imagesTakenTime,
        imagesTakenLocation
      });
      
      return response.data;
    } catch (error) {
      console.error('Error during clustering:', error);
      throw new Error('Failed to cluster images');
    }
  }
} 