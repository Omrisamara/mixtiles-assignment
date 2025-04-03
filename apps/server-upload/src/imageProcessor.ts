import { GoogleVisionApi } from './services/googleVisionApi';
import { OpenaiApi } from './services/openaiApi';
import { Exiftool } from './services/exiftool';
import { ClusterApi } from './services/clusterApi';
import { ClusterProcessor } from './services/clusterProcessor';
import { GoogleCloudStorage } from './services/googleCloudStorage';

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
    // INSTRUCTIONS:
    // Implement the functions.
    // For each of these calls, when you implement them, take into consideration that some api call might fail the should should inruduce some kind of retry machenism.
    // Use the following types for the return values of the functions, remove the types later when you add the implementation because the types will be inferred.

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

    const nonOutliersFiles = files.filter(file => !clusteredDescriptions.outliers.includes(file.filename));
    
    console.time('saveImages');
    const fileNameToUrlMap = await this.googleCloudStorage.saveImages(nonOutliersFiles);
    console.timeEnd('saveImages');

    require('fs').writeFileSync('./debug-files.json', JSON.stringify(files, null, 2));

    console.time('createFullClustersData');
    const clustersData = this.clusterProcessor.createFullClustersData(
      clusteredDescriptions.fileClusterMapping,
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
