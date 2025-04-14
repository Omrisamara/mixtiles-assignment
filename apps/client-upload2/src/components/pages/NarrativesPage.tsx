import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../common/BackButton';

interface NarrativeCardProps {
  label: string;
  backgroundUrl: string;
  clusterId: string;
  onClick: (id: string) => void;
}

const NarrativeCard: React.FC<NarrativeCardProps> = ({ label, backgroundUrl, clusterId, onClick }) => {
  return (
    <div 
      className="relative h-64 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-all hover:scale-105"
      onClick={() => onClick(clusterId)}
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
  const navigate = useNavigate();

  const handleNarrativeClick = (clusterId: string) => {
    navigate(`/narratives/${clusterId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <BackButton label="Back to Filter" />
      <h1 className="text-3xl font-bold mb-6">Narratives</h1>
      
      {narratives.length === 0 ? (
        <p className="text-gray-500">No narratives found. Please upload some images first.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {narratives.map((narrative) => (
            <NarrativeCard 
              key={narrative.clusterId}
              label={narrative.label.replace(/['"]/g, '')}
              backgroundUrl={narrative.photos[0].url}
              clusterId={narrative.clusterId}
              onClick={handleNarrativeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NarrativesPage; 