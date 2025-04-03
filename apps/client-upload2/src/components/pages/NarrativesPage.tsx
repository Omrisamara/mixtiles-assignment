import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

interface NarrativeCardProps {
  label: string;
  backgroundUrl: string;
}

const NarrativeCard: React.FC<NarrativeCardProps> = ({ label, backgroundUrl }) => {
  return (
    <div 
      className="relative h-64 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-all hover:scale-105"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent via-black/20" />
      <div className="absolute top-0 left-0 right-0 p-4">
        <h2 className="text-white text-xl font-bold">{label}</h2>
      </div>
    </div>
  );
};

export function NarrativesPage() {
  const { narratives } = useContext(AppContext);

  // Function to get a random image URL from the narrative's photos
  const getRandomImageUrl = (photos: any[]) => {
    if (!photos || photos.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * photos.length);
    return photos[randomIndex].url;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Narratives</h1>
      
      {narratives.length === 0 ? (
        <p className="text-gray-500">No narratives found. Please upload some images first.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {narratives.map((narrative) => (
            <NarrativeCard 
              key={narrative.clusterId}
              label={narrative.label.replace(/['"]/g, '')}
              backgroundUrl={getRandomImageUrl(narrative.photos)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NarrativesPage; 