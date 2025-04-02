import React, { useState } from 'react';
import ImageCard from './ImageCard';

interface ImageCardStackProps {
  images: Array<{
    id: string;
    url: string;
  }>;
}

const ImageCardStack: React.FC<ImageCardStackProps> = ({ images: initialImages }) => {
  const [images, setImages] = useState(initialImages);

  const handleSave = (id: string) => {
    console.log('Saved image:', id);
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleDelete = (id: string) => {
    console.log('Deleted image:', id);
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative flex justify-center items-center w-full">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="transition-all duration-300"
            style={{
              position: 'absolute',
              zIndex: images.length - index,
            }}
          >
            <ImageCard
              imageUrl={image.url}
              id={image.id}
              onSave={handleSave}
              onDelete={handleDelete}
              isCurrent={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageCardStack;