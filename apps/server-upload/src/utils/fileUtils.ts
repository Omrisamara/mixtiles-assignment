export interface FileClusterMapping {
  fileId: string;
  cluster: number;
}

export interface ClusteredDescriptions {
  fileClusterMapping: FileClusterMapping[];
  outliers: string[];
}

export interface FileWithOriginalName {
  filename: string;
  originalname: string;
}

export const filterFiles = (
  files: any[],
  clusteredDescriptions: ClusteredDescriptions,
  relevantClusters: number[]
): any[] => {
  return files.filter(file => {
    // Find which cluster this file belongs to
    const fileMapping = clusteredDescriptions.fileClusterMapping.find(
      (mapping) => mapping.fileId === file.originalname
    );
    
    const isOutlier = clusteredDescriptions.outliers.includes(file.filename);
    const isInRelevantCluster = fileMapping && relevantClusters.includes(fileMapping.cluster);
    
    return !isOutlier && isInRelevantCluster;
  });
}; 