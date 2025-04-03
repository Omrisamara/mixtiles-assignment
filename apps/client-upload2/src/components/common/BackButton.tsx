import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  label?: string;
  onClick?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  label = 'Back', 
  onClick 
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 mr-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="9 16 5 12 9 8" />
      </svg>
      <span>{label}</span>
    </button>
  );
};

export default BackButton; 