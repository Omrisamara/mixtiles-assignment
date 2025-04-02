import React, { useState } from 'react';
import ClusterHeader from './ClusterHeader';
import ImageCardStack from './imageCardStack';
import { ClusterData } from '../../../../contexts/AppContext';

interface ClusterCardProps {
  cluster: ClusterData;
  viewMode: 'grid' | 'stack';
}

const ClusterCard: React.FC<ClusterCardProps> = ({ cluster, viewMode }) => {
  const [expanded, setExpanded] = useState(true);

  // Format data for ImageCardStack component
  const stackImages = cluster.photos.map(photo => ({
    id: photo.filename,
    url: photo.url
  }));

  return (
    <div className="mb-8 overflow-hidden">
      <div 
        className="p-4 bg-white cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <ClusterHeader 
          label={cluster.label} 
          photoCount={cluster.photos.length} 
        />
      </div>

      {expanded && (
        <div className="bg-gray-50 rounded-lg p-4">
          {viewMode === 'stack' && stackImages.length > 0 ? (
            <div className="h-96">
              <ImageCardStack images={stackImages} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cluster.photos.map((photo, index) => (
                <div key={index} className="border bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img 
                    src={photo.url} 
                    alt={photo.filename} 
                    className="w-full h-40 object-cover" 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClusterCard; 