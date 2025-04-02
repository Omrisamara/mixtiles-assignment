import { ClusterData, ImageTakenLocation, ImageTakenTime, ImageVisionDescription } from '../imageProcessor';
import { FileClusterMapping } from './clusterApi';

export class ClusterProcessor {
  createFullClustersData(
    clusteredDescriptions: FileClusterMapping[],
    clusterLabelsMap: Map<number, string>,
    fileNameToUrlMap: Record<string, string>,
    imagesTakenTime: ImageTakenTime[],
    imagesTakenLocation: ImageTakenLocation[],
    imagesDescriptions: ImageVisionDescription[] = []
  ): ClusterData[] {
    // Group files by cluster
    const clusterGroups = new Map<number, string[]>();
    
    // Group files by their cluster ID
    for (const mapping of clusteredDescriptions) {
      const { cluster, fileId } = mapping;
      if (!clusterGroups.has(cluster)) {
        clusterGroups.set(cluster, []);
      }
      clusterGroups.get(cluster)?.push(fileId);
    }
    
    // Create lookup maps for image data
    const timeMap = new Map<string, Date>();
    const locationMap = new Map<string, { lat: number; lng: number }>();
    const descriptionMap = new Map<string, string>();
    
    for (const item of imagesTakenTime) {
      timeMap.set(item.filename, item.takenTime);
    }
    
    for (const item of imagesTakenLocation) {
      locationMap.set(item.filename, item.location);
    }
    
    for (const item of imagesDescriptions) {
      descriptionMap.set(item.filename, item.description);
    }
    
    // Create ClusterData objects for each cluster
    const result: ClusterData[] = [];
    
    clusterGroups.forEach((fileIds, clusterId) => {
      // Skip if no label found for this cluster
      if (!clusterLabelsMap.has(clusterId)) {
        return;
      }
      
      const label = clusterLabelsMap.get(clusterId) as string;
      const photos = fileIds.map(filename => {
        return {
          filename,
          url: fileNameToUrlMap[filename] || '',
          takenTime: timeMap.get(filename),
          location: locationMap.get(filename),
          description: descriptionMap.get(filename) || ''
        };
      });
      
      if (photos.length > 0) {
        result.push({
          clusterId: clusterId.toString(),
          label,
          photos: photos as any // Type assertion to match the required type
        });
      }
    });
    
    return result;
  }
} 