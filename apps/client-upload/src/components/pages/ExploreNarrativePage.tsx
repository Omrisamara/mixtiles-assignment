import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';
import Stories from 'react-insta-stories';

// Simplified exit button that navigates back to narratives
const ExitButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="fixed top-6 right-4 z-[9999]">
      <button
        className="bg-black bg-opacity-20 hover:bg-opacity-90 text-white p-3 rounded-full backdrop-blur-md"
        style={{ cursor: 'pointer' }}
        aria-label="Exit fullscreen"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Custom story content renderer with sliding animation
const StoryContent = ({ url, heading }: { url: string, heading: string }) => {
  const [isHorizontal, setIsHorizontal] = useState(false);
  
  // Check if image is horizontal on load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setIsHorizontal(img.naturalWidth > img.naturalHeight);
  };

  return (
    <div 
      className="story-slide"
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <img 
        src={url} 
        alt={heading} 
        onLoad={handleImageLoad}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          animation: isHorizontal ? 'panHorizontal 5s ease-in-out' : 'none',
        }}
      />
    </div>
  );
};

export function ExploreNarrativePage() {
  const { narrativeId } = useParams<{ narrativeId: string }>();
  const navigate = useNavigate();
  const { narratives } = useContext(AppContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const narrative = narratives.find(n => n.clusterId === narrativeId);

  // Exit fullscreen and navigate back to narratives
  const exitToNarratives = useCallback(() => {
    console.log('Exiting to narratives page');
    navigate('/narratives');
  }, [navigate]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitToNarratives();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitToNarratives]);
  
  // Redirect to narratives page if narrative not found
  useEffect(() => {
    if (!narrative) {
      console.log('Narrative not found, redirecting to narratives page');
      navigate('/narratives');
    }
  }, [narrative, navigate]);
  
  // If narrative is not found, render nothing while redirecting
  if (!narrative) {
    return null;
  }

  // Transform narrative photos into stories format with custom content renderer
  const stories = narrative.photos.map(photo => ({
    content: () => (
      <StoryContent 
        url={photo.url} 
        heading={narrative.label.replace(/['"]/g, '')}
      />
    ),
    duration: 5000,
  }));

  // Always display fullscreen stories since images are always available
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black">
        <Stories
          stories={stories}
          defaultInterval={5000}
          width="100vw"
          height="100vh"
          currentIndex={currentIndex}
          onStoryEnd={(index: number) => {
            if (index === stories.length - 1) {
              setCurrentIndex(0);
            } else {
              setCurrentIndex(index + 1);
            }
          }}
          onAllStoriesEnd={exitToNarratives}
          keyboardNavigation
        />
      </div>
      
      {/* Single exit button that navigates back to narratives */}
      <ExitButton onClick={exitToNarratives} />

      {/* CSS animation */}
      <style>
        {`
          @keyframes slideIn {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0); }
          }

          @keyframes panHorizontal {
            0% { object-position: left center; }
            100% { object-position: right center; }
          }
        `}
      </style>
    </>
  );
}

export default ExploreNarrativePage; 