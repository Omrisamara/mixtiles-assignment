import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';

export function ExploreNarrativePage() {
  const { narrativeId } = useParams<{ narrativeId: string }>();
  const navigate = useNavigate();
  const { narratives } = useContext(AppContext);
  
  const narrative = narratives.find(n => n.clusterId === parseInt(narrativeId || '', 10));
  
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
      
      <h1 className="text-3xl font-bold mb-6">
        {narrative.label.replace(/['"]/g, '')}
      </h1>
      
      {/* Placeholder for narrative content */}
      <div className="bg-gray-100 p-4 rounded">
        <p>Narrative details will be implemented later</p>
      </div>
    </div>
  );
}

export default ExploreNarrativePage; 