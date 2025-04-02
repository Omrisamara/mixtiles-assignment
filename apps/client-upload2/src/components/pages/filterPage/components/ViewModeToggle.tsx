import React from 'react';
import { Grid, Layers } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'stack';
  onChange: (mode: 'grid' | 'stack') => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onChange }) => {
  return (
    <div className="flex items-center justify-end mb-4 space-x-2">
      <span className="text-sm font-medium text-gray-700">View mode:</span>
      <div className="flex border rounded-lg overflow-hidden">
        <button
          className={`flex items-center px-3 py-2 ${
            viewMode === 'grid' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onChange('grid')}
          aria-label="Grid view"
        >
          <Grid size={18} />
        </button>
        <button
          className={`flex items-center px-3 py-2 ${
            viewMode === 'stack' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onChange('stack')}
          aria-label="Stack view"
        >
          <Layers size={18} />
        </button>
      </div>
    </div>
  );
};

export default ViewModeToggle; 