import { GoogleVisionApi } from './services/googleVisionApi';
import { OpenaiApi } from './services/openaiApi';
import { Exiftool } from './services/exiftool';
import { ClusterApi } from './services/clusterApi';
import { ClusterProcessor } from './services/clusterProcessor';
import { GoogleCloudStorage } from './services/googleCloudStorage';

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

    console.time('getImagesTakenTimeAndLocation');
    const [imagesTakenTime, imagesTakenLocation] = await this.exiftool.getImagesTakenTimeAndLocation(files);
    console.timeEnd('getImagesTakenTimeAndLocation');

    console.time('cluster');
    const clusteredDescriptions = await this.clusterApi.cluster(
      descriptionsEmbddings,
      imagesTakenTime,
      imagesTakenLocation
    );
    console.timeEnd('cluster');

    console.time('createClusterNames');
    const clusterLabelsMap = await this.openaiApi.createClusterNames(
      clusteredDescriptions,
      imagesVisionDescriptions
    );
    console.timeEnd('createClusterNames');

    const relevantClusters = await this.openaiApi.getRelevantClusters(clusterLabelsMap);
    console.log('relevantClusters', relevantClusters);

    // Filter out files that are either outliers or not in relevant clusters
    const relevantFiles = files.filter(file => {
      // Find which cluster this file belongs to
      const fileMapping = clusteredDescriptions.fileClusterMapping.find(
        mapping => mapping.fileId === file.originalname
      );
      
      const isOutlier = clusteredDescriptions.outliers.includes(file.filename);
      const isDuplicate = clusteredDescriptions.duplicates.includes(file.filename);
      const isInRelevantCluster = fileMapping && relevantClusters.includes(fileMapping.cluster);
      
      return !isOutlier && isInRelevantCluster;
    });
    
    console.time('saveImages');
    const fileNameToUrlMap = await this.googleCloudStorage.saveImages(relevantFiles);
    console.timeEnd('saveImages');

    // require('fs').writeFileSync('./debug-files.json', JSON.stringify(files, null, 2));

    console.time('createFullClustersData');
    // Filter cluster mappings to only include files from relevant clusters
    const relevantClusterMappings = clusteredDescriptions.fileClusterMapping.filter(
      mapping => relevantClusters.includes(mapping.cluster)
    );

    const clustersData = this.clusterProcessor.createFullClustersData(
      relevantClusterMappings,
      clusterLabelsMap,
      fileNameToUrlMap,
      imagesTakenTime,
      imagesTakenLocation,
      imagesVisionDescriptions
    );
    console.timeEnd('createFullClustersData');
    
    return clustersData;
  }
}
