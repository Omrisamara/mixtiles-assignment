import React, { useContext, useState } from 'react';
import { AppContext } from '../../../contexts/AppContext';
import ClusterCard from './components/ClusterCard';
import ViewModeToggle from './components/ViewModeToggle';

export function FilterPage() {
  const { narratives, setNarratives } = useContext(AppContext);
  const [viewMode, setViewMode] = useState<'grid' | 'stack'>('grid');
  
  // Count total images
  const totalImages = narratives.reduce((total, narrative) => total + narrative.photos.length, 0);
  
  const handleSwipe = (photoId: string, clusterId: number) => {
    const updatedNarratives = narratives.map(narrative => {
      if (narrative.clusterId === clusterId) {
        return {
          ...narrative,
          photos: narrative.photos.filter(photo => photo.filename !== photoId)
        };
      }
      return narrative;
    });
    
    setNarratives(updatedNarratives);
  };

  const handleRemoveNarrative = (clusterId: number) => {
    const updatedNarratives = narratives.filter(narrative => 
      narrative.clusterId !== clusterId
    );
    setNarratives(updatedNarratives);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3">
          <h1 className="text-3xl font-bold">Choose your photos</h1>
          <h3 className="text-lg font-medium text-gray-900">Swipe to remove the photos you don't want to include in your album.</h3>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {narratives.length} {narratives.length === 1 ? 'cluster' : 'clusters'}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {totalImages} {totalImages === 1 ? 'image' : 'images'}
              </span>
            </div>
            
            {narratives.length > 0 && (
              <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            )}
          </div>
        </div>
        
        {/* Divider line */}
        <div className="border-b border-gray-200"></div>
      </div>
      
      {narratives.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No images uploaded yet</h3>
          <p className="mt-1 text-sm text-gray-500">Go to the upload page to add some photos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {narratives.map((cluster) => (
            <ClusterCard
              key={cluster.clusterId}
              cluster={cluster}
              viewMode={viewMode}
              onSwipe={(photoId) => handleSwipe(photoId, cluster.clusterId)}
              onRemoveCluster={handleRemoveNarrative}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterPage; 