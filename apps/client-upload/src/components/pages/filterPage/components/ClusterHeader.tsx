import React from 'react';

interface ClusterHeaderProps {
  label: string;
  photoCount: number;
  onRemoveCluster?: () => void;
}

const ClusterHeader: React.FC<ClusterHeaderProps> = ({ label, photoCount, onRemoveCluster }) => {
  // Remove special characters like quotes from the label
  const sanitizedLabel = label.replace(/['"]/g, '');
  
  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
      <h2 className="text-xl font-semibold mr-2">{sanitizedLabel}</h2>
        <span className="text-gray-500 py-1 rounded-full text-sm whitespace-nowrap w-fit">
          {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onRemoveCluster && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemoveCluster();
            }}
            className="ml-2 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Remove entire cluster"
            aria-label="Remove entire cluster"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ClusterHeader; 