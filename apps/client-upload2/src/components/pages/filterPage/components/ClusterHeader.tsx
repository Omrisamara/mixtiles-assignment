import React from 'react';

interface ClusterHeaderProps {
  label: string;
  photoCount: number;
}

const ClusterHeader: React.FC<ClusterHeaderProps> = ({ label, photoCount }) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">{label}</h2>
      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
        {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
      </span>
    </div>
  );
};

export default ClusterHeader; 