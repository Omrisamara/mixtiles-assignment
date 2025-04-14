import { GoogleVisionApi } from './services/googleVisionApi.js';
import { OpenaiApi } from './services/openaiApi.js';
import { Exiftool } from './services/exiftool.js';
import { ClusterApi } from './services/clusterApi.js';
import { ClusterProcessor } from './services/clusterProcessor.js';
import { GoogleCloudStorage } from './services/googleCloudStorage.js';
import { filterFiles } from './utils/fileUtils';

export type FileClusterMapping = { [filename: string]: string };

export type ClusterData = {
    clusterId: string;
    label: string;
    photos: [
      {
        filename: string;
        url: string;
        takenTime?: Date;
        location?: { lat: number; lng: number };
        description: string;
      }
    ];
}

export type ImageVisionDescription = {filename: string, description: string};
export type ImageTakenLocation = {filename: string, location: {lat: number, lng: number}};
export type ImageTakenTime = {filename: string, takenTime: Date}
export type Embedding = {filename: string, vector: number[]};

export class ImageProcessor {
  constructor(
    private googleVisionApi: GoogleVisionApi,
    private openaiApi: OpenaiApi,
    private exiftool: Exiftool,
    private clusterApi: ClusterApi,
    private clusterProcessor: ClusterProcessor,
    private googleCloudStorage: GoogleCloudStorage
  ) {}

  
  async processImages(files: Express.Multer.File[]): Promise<ClusterData[]> {
    const imagesVisionDescriptions = await this.googleVisionApi.getDescriptions(files);
    
    const descriptionsEmbddings = await this.openaiApi.getEmbddings(imagesVisionDescriptions);

    const [imagesTakenTime, imagesTakenLocation] = await this.exiftool.getImagesTakenTimeAndLocation(files);

    const clusteredDescriptions = await this.clusterApi.cluster(
      descriptionsEmbddings,
      imagesTakenTime,
      imagesTakenLocation
    );

    const clusterLabelsMap = await this.openaiApi.createClusterNames(
      clusteredDescriptions,
      imagesVisionDescriptions
    );

    const relevantClusters = await this.openaiApi.getRelevantClusters(clusterLabelsMap);
    
    console.log("Number of clusters: ", Array.from(clusterLabelsMap.keys()).length)
    console.log("Number of relevant clusters: ", relevantClusters.length)

    const relevantFiles = filterFiles(files, clusteredDescriptions, relevantClusters);
    
    const fileNameToUrlMap = await this.googleCloudStorage.saveImages(relevantFiles);

    // Filter cluster mappings to only include files from relevant clusters
    const relevantClusterMappings = clusteredDescriptions.fileClusterMapping.filter(
      (mapping: { cluster: number }) => relevantClusters.includes(mapping.cluster)
    );

    const clustersData = this.clusterProcessor.createFullClustersData(
      relevantClusterMappings,
      clusterLabelsMap,
      fileNameToUrlMap,
      imagesTakenTime,
      imagesTakenLocation,
      imagesVisionDescriptions
    );
    
    return clustersData;
  }
}
