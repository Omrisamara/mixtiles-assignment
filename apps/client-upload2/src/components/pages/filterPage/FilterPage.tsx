import React, { useContext } from 'react';
import { AppContext } from '../../../contexts/AppContext';
import ImageCardStack from './components/imageCardStack';

export function FilterPage() {
  const { narratives } = useContext(AppContext);
  
  // Count total images
  const totalImages = narratives.reduce((total, narrative) => total + narrative.photos.length, 0);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Filter Page</h1>
      
      <div className="mb-4">
        <p className="text-lg font-semibold">Total clusters: {narratives.length}</p>
        <p className="text-lg font-semibold">Total images: {totalImages}</p>
      </div>
      
      {narratives.length === 0 ? (
        <p className="mb-4">No images uploaded yet. Go to the upload page first.</p>
      ) : (
        <div>
          {/* Image Card Stacks for each narrative */}
          {narratives.map((narrative) => {
            // Prepare data for ImageCardStack
            const narrativeImages = narrative.photos.map(photo => ({
              id: photo.filename,
              url: photo.url
            }));
            
            return narrativeImages.length > 0 ? (
              <div key={`stack-${narrative.clusterId}`} className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-center">{narrative.label}</h2>
                <div className="h-96">
                  <ImageCardStack images={narrativeImages} />
                </div>
              </div>
            ) : null;
          })}
          
          {/* Existing photo grid */}
          {narratives.map((cluster) => (
            <div key={cluster.clusterId} className="mb-8 border p-4 rounded">
              <h2 className="text-xl font-bold mb-2">Cluster: {cluster.label}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cluster.photos.map((photo, index) => (
                  <div key={index} className="border p-2 rounded">
                    <img 
                      src={photo.url} 
                      alt={photo.filename} 
                      className="w-full h-40 object-cover mb-2" 
                    />
                    <p className="text-sm truncate">{photo.filename}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterPage; 