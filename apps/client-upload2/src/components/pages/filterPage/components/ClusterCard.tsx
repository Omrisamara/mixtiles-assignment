import React, { useState, useCallback, memo } from 'react';
import { useSwipeable, SwipeEventData } from 'react-swipeable';
import ClusterHeader from './ClusterHeader';
import ImageCardStack from './imageCardStack';
import { ClusterData } from '../../../../contexts/AppContext';

interface ClusterCardProps {
  cluster: ClusterData;
  viewMode: 'grid' | 'stack';
  onSwipe?: (photoId: string) => void;
  onRemoveCluster?: (clusterId: number) => void;
}

interface SwipeableImageProps {
  photo: ClusterData['photos'][0];
  swipingPhotoId: string | null;
  swipeOffset: number;
  onSwiping: (e: SwipeEventData, photoId: string) => void;
  onSwiped: (e: SwipeEventData, photoId: string) => void;
  onDelete: (photoId: string) => void;
  onShowDeleteOption: (photoId: string, show: boolean) => void;
  isActiveDeletePhoto: boolean;
}

const SwipeableImage: React.FC<SwipeableImageProps> = memo(({
  photo,
  swipingPhotoId,
  swipeOffset,
  onSwiping,
  onSwiped,
  onDelete,
  onShowDeleteOption,
  isActiveDeletePhoto
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteOption, setShowDeleteOption] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Update showDeleteOption based on external controls
  React.useEffect(() => {
    if (!isActiveDeletePhoto && showDeleteOption) {
      setShowDeleteOption(false);
    }
  }, [isActiveDeletePhoto]);
  
  const handlers = useSwipeable({
    onSwiping: (e) => {
      setIsSwiping(true);
      onSwiping(e, photo.filename);
    },
    onSwiped: (e) => {
      if (Math.abs(e.deltaX) > 100) {
        setIsDeleting(true);
        // Reduced timeout to match new animation duration
        setTimeout(() => {
          onSwiped(e, photo.filename);
        }, 100);
      } else {
        onSwiped(e, photo.filename);
      }
      // Reset swiping state after a short delay to avoid accidental clicks
      setTimeout(() => setIsSwiping(false), 50);
    }
  });

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSwiping) {
      const newState = !showDeleteOption;
      setShowDeleteOption(newState);
      onShowDeleteOption(photo.filename, newState);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(photo.filename);
    }, 100);
    setShowDeleteOption(false);
    onShowDeleteOption(photo.filename, false);
  };

  return (
    <div
      {...handlers}
      id={`image-${photo.filename}`}
      className={`relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all transform origin-center ${
        isDeleting ? 'animate-delete-slide opacity-0 scale-95' : ''
      } ${isActiveDeletePhoto ? 'z-40' : 'z-0 border'}`}
      style={{
        transform: swipingPhotoId === photo.filename 
          ? `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)` 
          : 'none',
        opacity: swipingPhotoId === photo.filename && Math.abs(swipeOffset) > 50 
          ? 1 - Math.min(Math.abs(swipeOffset) / 300, 0.5) 
          : isDeleting ? 0 : 1,
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={handleImageClick}
    >
      <img 
        src={photo.url} 
        alt={photo.filename} 
        className="w-full h-40 object-cover" 
        draggable="false"
      />
      {swipingPhotoId === photo.filename && Math.abs(swipeOffset) > 50 && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50">
          <span className="text-white font-semibold">Release to Delete</span>
        </div>
      )}
      {showDeleteOption && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50 cursor-pointer"
          onClick={handleDeleteClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="ml-2 text-white font-semibold">Delete</span>
        </div>
      )}
    </div>
  );
});

SwipeableImage.displayName = 'SwipeableImage';

const ClusterCard: React.FC<ClusterCardProps> = ({ cluster, viewMode, onSwipe, onRemoveCluster }) => {
  const [swipingPhotoId, setSwipingPhotoId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [activeDeletePhotoId, setActiveDeletePhotoId] = useState<string | null>(null);

  // Format data for ImageCardStack component
  const stackImages = cluster.photos.map(photo => ({
    id: photo.filename,
    url: photo.url
  }));

  const handleSwipe = useCallback((photoId: string) => {
    if (onSwipe) {
      onSwipe(photoId);
    }
  }, [onSwipe]);

  const handleRemoveCluster = useCallback(() => {
    if (onRemoveCluster) {
      onRemoveCluster(cluster.clusterId);
    }
  }, [onRemoveCluster, cluster.clusterId]);

  const handleSwiping = useCallback((e: SwipeEventData, photoId: string) => {
    if (e.dir === 'Left' || e.dir === 'Right') {
      setSwipingPhotoId(photoId);
      setSwipeOffset(e.deltaX);
    }
  }, []);

  const handleSwiped = useCallback((e: SwipeEventData, photoId: string) => {
    if (Math.abs(e.deltaX) > 100) { // Threshold for swipe to delete
      handleSwipe(photoId);
    }
    setSwipingPhotoId(null);
    setSwipeOffset(0);
  }, [handleSwipe]);

  const handleDelete = useCallback((photoId: string) => {
    handleSwipe(photoId);
    setActiveDeletePhotoId(null);
  }, [handleSwipe]);

  const handleShowDeleteOption = useCallback((photoId: string, show: boolean) => {
    setActiveDeletePhotoId(show ? photoId : null);
  }, []);

  const handleOverlayClick = useCallback(() => {
    setActiveDeletePhotoId(null);
  }, []);

  return (
    <div className="mb-8 overflow-hidden">
      <div className="py-4 bg-white">
        <ClusterHeader 
          label={cluster.label} 
          photoCount={cluster.photos.length}
          onRemoveCluster={onRemoveCluster ? handleRemoveCluster : undefined}
        />
      </div>

      <div className="relative">
        {activeDeletePhotoId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
        )}
        
        {viewMode === 'stack' && stackImages.length > 0 ? (
          <div className="h-96">
            <ImageCardStack images={stackImages} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative">
            {cluster.photos.map((photo) => (
              <SwipeableImage
                key={photo.filename}
                photo={photo}
                swipingPhotoId={swipingPhotoId}
                swipeOffset={swipeOffset}
                onSwiping={handleSwiping}
                onSwiped={(e, photoId) => handleSwiped(e, photoId)}
                onDelete={handleDelete}
                onShowDeleteOption={handleShowDeleteOption}
                isActiveDeletePhoto={activeDeletePhotoId === photo.filename}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClusterCard; 