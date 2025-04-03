import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';
import Stories from 'react-insta-stories';

// Separate component for the exit button
const ExitButton = ({ onClick }: { onClick: () => void }) => {
  // Fallback function in case the primary onClick doesn't work
  const handleForcedExit = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Forced exit clicked');
    // Try the normal exit first
    onClick();
    
    // Set a timeout to reload the page if the exit doesn't work
    setTimeout(() => {
      window.location.href = window.location.pathname.replace(/\/narratives\/\d+/, '/narratives');
    }, 300);
  };

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <button
        className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3 rounded-full shadow-lg"
        style={{ cursor: 'pointer' }}
        aria-label="Exit fullscreen"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onDoubleClick={handleForcedExit}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export function ExploreNarrativePage() {
  const { narrativeId } = useParams<{ narrativeId: string }>();
  const navigate = useNavigate();
  const { narratives } = useContext(AppContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(true);
  
  // Add a direct navigation method as another escape route
  const goToNarratives = useCallback(() => {
    navigate('/narratives');
  }, [navigate]);
  
  const narrative = narratives.find(n => n.clusterId === parseInt(narrativeId || '', 10));

  // Memoize the exitFullScreen function to avoid recreating it on every render
  const exitFullScreen = useCallback(() => {
    console.log('Exit fullscreen clicked');
    setIsFullScreen(false);
    // Force a re-render
    setTimeout(() => setCurrentIndex(prev => prev), 0);
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFullScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitFullScreen]);
  
  // Force initial render to ensure the component is properly mounted
  useEffect(() => {
    const timer = setTimeout(() => setCurrentIndex(0), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!narrative) {
    return (
      <div className="container mx-auto p-4">
        <button 
          onClick={() => navigate('/narratives')}
          className="mb-4 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-lg">Back to Narratives</span>
        </button>
        <p className="text-red-500">Narrative not found.</p>
      </div>
    );
  }

  // Transform narrative photos into stories format
  const stories = narrative.photos.map(photo => ({
    url: photo.url,
    type: 'image' as const,
    duration: 5000,
    header: {
      heading: narrative.label.replace(/['"]/g, ''),
      subheading: photo.description,
      profileImage: ''
    }
  }));

  // Return to fullscreen mode
  const enterFullScreen = () => {
    setIsFullScreen(true);
  };

  if (isFullScreen && stories.length > 0) {
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
            onAllStoriesEnd={() => {
              exitFullScreen();
            }}
            keyboardNavigation
            storyStyles={{
              objectFit: 'contain',
              width: '100%',
              height: '100%',
              backgroundColor: '#000'
            }}
          />
        </div>
        
        {/* Separate overlay for the exit button */}
        <ExitButton onClick={exitFullScreen} />
        
        {/* Emergency escape button */}
        <div className="fixed top-4 left-4 z-[9999]">
          <button
            className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3 rounded-full shadow-lg"
            style={{ cursor: 'pointer' }}
            aria-label="Back to narratives"
            onClick={goToNarratives}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => navigate('/narratives')}
        className="mb-4 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-lg">Back to Narratives</span>
      </button>
      
      <h1 className="text-3xl font-bold mb-6 text-center">
        {narrative.label.replace(/['"]/g, '')}
      </h1>
      
      <div className="mx-auto max-w-md rounded-lg overflow-hidden shadow-xl">
        {stories.length > 0 ? (
          <>
            <div className="relative">
              <img 
                src={narrative.photos[0].url}
                alt={narrative.label}
                className="w-full h-64 object-cover"
              />
              <button 
                onClick={enterFullScreen}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-opacity"
              >
                <span className="text-white font-bold text-xl">View Story</span>
              </button>
            </div>
            <div className="p-4 bg-gray-100">
              <p className="text-sm text-gray-600">{narrative.photos[0]?.description}</p>
              <div className="flex justify-center mt-2">
                <p className="text-sm text-gray-500">{stories.length} images in this narrative</p>
              </div>
            </div>
            
            {/* Thumbnail navigation */}
            <div className="p-2 bg-gray-200 overflow-x-auto">
              <div className="flex space-x-2">
                {narrative.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-16 h-16 rounded overflow-hidden"
                  >
                    <img 
                      src={photo.url} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-100 p-4 rounded text-center">
            <p>No images available in this narrative.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExploreNarrativePage; 