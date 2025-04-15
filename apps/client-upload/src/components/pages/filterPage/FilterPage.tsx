import React, { useContext, useState } from 'react';
import { AppContext } from '../../../contexts/AppContext';
import ClusterCard from './components/ClusterCard';
import ViewModeToggle from './components/ViewModeToggle';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../common/BackButton';

export function FilterPage() {
  const { narratives, setNarratives } = useContext(AppContext);
  const [viewMode, setViewMode] = useState<'grid' | 'stack'>('grid');
  const navigate = useNavigate();
  
  // Count total images
  const totalImages = narratives.reduce((total, narrative) => total + narrative.photos.length, 0);
  
  const handleSwipe = (photoId: string, clusterId: string) => {
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

  const handleRemoveNarrative = (clusterId: string) => {
    const updatedNarratives = narratives.filter(narrative => 
      narrative.clusterId !== clusterId
    );
    setNarratives(updatedNarratives);
  };

  const handleNavigateToNarratives = () => {
    navigate('/narratives');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <BackButton label="Back to Upload" />
      <div className="mb-8">
        <div className="flex flex-col space-y-3 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Choose your photos</h1>
          <p className="text-lg text-gray-600">Swipe or click to remove the photos you don't want to include in your album.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center gap-2 mb-3 sm:mb-0">
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
        
        {/* Divider line */}
        <div className="border-b border-gray-200 mt-4"></div>
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
        <div className="space-y-6 mb-20">
          {narratives.map((cluster) => (
            <ClusterCard
              key={cluster.clusterId}
              cluster={cluster}
              viewMode={viewMode}
              onSwipe={(photoId) => handleSwipe(photoId, cluster.clusterId)}
              onRemoveCluster={() => handleRemoveNarrative(cluster.clusterId)}
            />
          ))}
        </div>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 p-4 z-10">
        <button
          onClick={handleNavigateToNarratives}
          className="w-full px-6 py-4 backdrop-blur-md bg-blue-600/90 border border-blue-500/40 shadow-lg text-white rounded-xl font-medium hover:bg-blue-700/90 transition-colors flex items-center justify-center"
        >
          <span>Explore your narratives</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 ml-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default FilterPage; 