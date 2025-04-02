import React, { useRef } from 'react';

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
          backgroundColor: '#007aff',
          color: 'white',
          border: 'none',
        }}
      >
        📷 Select Photos
      </button>
    </div>
  );
};

export default UploadButton;
