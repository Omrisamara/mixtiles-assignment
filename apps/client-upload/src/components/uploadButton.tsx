import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

const UploadButton = ({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click(); // 👈 Triggers file picker
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected(files);
    e.target.value = ''; // 🧽 Reset input so user can re-select same files
  };

  return (
    <div>
      {/* 👇 Hidden file input */}
      <input
        type="file"
        accept="image/*"
        multiple
        ref={inputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleButtonClick}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '8px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Upload size={20} />
        Select Photos
      </button>
    </div>
  );
};

export default UploadButton;
