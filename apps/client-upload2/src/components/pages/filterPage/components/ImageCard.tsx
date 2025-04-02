import React from 'react';
import { useState, useRef } from 'react';
import { Save, X } from 'lucide-react';

interface ImageCardProps {
  imageUrl: string;
  id: string;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  isCurrent: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ imageUrl, id, onSave, onDelete, isCurrent }) => {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = false;
    setDragStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = false;
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart) return;
    isDragging.current = true;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    setOffset({
      x: currentX - dragStart.x,
      y: currentY - dragStart.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return;
    isDragging.current = true;
    
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;

    if (Math.abs(offset.x) > 100) {
      if (offset.x > 0) {
        onSave(id);
      } else {
        onDelete(id);
      }
    }
    setDragStart(null);
    setOffset({ x: 0, y: 0 });
    isDragging.current = false;
  };

  const handleTouchEnd = handleDragEnd;
  const handleMouseUp = handleDragEnd;

  const handleButtonClick = (e: React.MouseEvent, action: 'save' | 'delete') => {
    e.stopPropagation();
    if (action === 'save') {
      onSave(id);
    } else {
      onDelete(id);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative touch-none select-none transition-all duration-300 ${
        isCurrent ? 'scale-100 z-10' : 'scale-90 opacity-70'
      }`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.1}deg) scale(${isCurrent ? 1 : 0.9})`,
        cursor: isCurrent ? 'grab' : 'default',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="relative w-72 h-96 rounded-xl overflow-hidden shadow-xl">
        <img
          src={imageUrl}
          alt="Card"
          className="w-full h-full object-cover bg-white"
          draggable="false"
        />
        {isCurrent && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={(e) => handleButtonClick(e, 'delete')}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => handleButtonClick(e, 'save')}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              <Save className="w-6 h-6" />
            </button>
          </div>
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            Math.abs(offset.x) > 50 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {offset.x > 50 && (
            <div className="bg-green-500 rounded-full p-4 absolute right-4">
              <Save className="w-8 h-8 text-white" />
            </div>
          )}
          {offset.x < -50 && (
            <div className="bg-red-500 rounded-full p-4 absolute left-4">
              <X className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;