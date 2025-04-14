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
    console.time('getDescriptions');
    const imagesVisionDescriptions = await this.googleVisionApi.getDescriptions(files);
    console.timeEnd('getDescriptions');
    
    console.time('getEmbddings');
    const descriptionsEmbddings = await this.openaiApi.getEmbddings(imagesVisionDescriptions);
    console.timeEnd('getEmbddings');

    const [imagesTakenTime, imagesTakenLocation] = await this.exiftool.getImagesTakenTimeAndLocation(files);

    console.time('cluster descriptions');
    const clusteredDescriptions = await this.clusterApi.cluster(
      descriptionsEmbddings,
      imagesTakenTime,
      imagesTakenLocation
    );
    console.timeEnd('cluster descriptions');

    console.time('createClusterNames');
    const clusterLabelsMap = await this.openaiApi.createClusterNames(
      clusteredDescriptions,
      imagesVisionDescriptions
    );
    console.timeEnd('createClusterNames');

    console.log('all clusters');
    console.log(Array.from(clusterLabelsMap.keys()).length)

    // // Print all cluster descriptions
    // console.log('Cluster descriptions:');
    // for (const [clusterId, clusterInfo] of clusterLabelsMap.entries()) {
    //   console.log(`Cluster ${clusterId}: ${clusterInfo} - ${clusterInfo.description}`);
    // }

    const relevantClusters = await this.openaiApi.getRelevantClusters(clusterLabelsMap);
    console.log('relevantClusters', relevantClusters);

    const relevantFiles = filterFiles(files, clusteredDescriptions, relevantClusters);
    
    console.time('saveImages');
    const fileNameToUrlMap = await this.googleCloudStorage.saveImages(relevantFiles);
    console.timeEnd('saveImages');

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
