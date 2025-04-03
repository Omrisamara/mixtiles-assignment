import React, { useState, useCallback, useContext } from 'react';
import imageCompression from 'browser-image-compression';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import XHRUpload from '@uppy/xhr-upload';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import UploadButton from '../../components/uploadButton';
import heic2any from 'heic2any';
import { AppContext } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

export function UploadPage() {
  const { setNarratives } = useContext(AppContext);
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [compressingCount, setCompressingCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Create a Uppy instance only once with useMemo
  const uppyInstance = React.useMemo(() => {
    const uppy = new Uppy({
      id: 'uppy',
      autoProceed: true,
      allowMultipleUploadBatches: true,
      restrictions: {
        maxNumberOfFiles: 1000,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['image/*'],
      },
    });

    // Use XHRUpload for uploading files
    uppy.use(XHRUpload, {
      endpoint: 'http://192.168.1.73:4000/api/upload', // Replace with your server endpoint
      formData: true,
      fieldName: 'files',
      headers: {
        'X-Custom-Header': 'Custom header value',
      },
      bundle: true
    });

    // Add a preprocessor for image conversion and compression
    uppy.addPreProcessor(async (fileIDs) => {
      for (const fileID of fileIDs) {
        const file = uppy.getFile(fileID);
        
        // Handle HEIC conversion first
        if (file && (file.type === 'image/heic' || file.type === 'image/heif' || file.name?.toLowerCase().endsWith('.heic'))) {
          try {
            setCompressingCount(prev => prev + 1);
            setUploadStatus(`Converting HEIC image ${file.name?.toString() || 'unknown'} to JPEG...`);
            
            // Cast to File to ensure compatibility
            const fileData = file.data as File;
            
            // Convert HEIC to JPEG
            const jpegBlob = await heic2any({
              blob: fileData,
              toType: 'image/jpeg',
              quality: 0.5
            }) as Blob;
            
            // Create a new file with JPEG extension
            const newFileName = file.name?.replace(/\.[^/.]+$/, '') + '.jpg';
            const jpegFile = new File([jpegBlob], newFileName, { type: 'image/jpeg' });
            
            // Update the file with converted data
            uppy.setFileState(fileID, {
              data: jpegFile,
              name: newFileName,
              type: jpegFile.type,
              size: jpegFile.size,
            });
            
            setCompressingCount(prev => prev - 1);
          } catch (error) {
            console.error('Error converting HEIC image:', error);
            setCompressingCount(prev => prev - 1);
          }
        }
        // Now handle compression for JPEG and PNG
         else if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
          try {
            setCompressingCount(prev => prev + 1);
            setUploadStatus(`Compressing image ${file.name?.toString() || 'unknown'}...`);
            
            const options = {
              maxSizeMB: 0.3,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              preserveExif: true,
            };

            // Cast to File to ensure compatibility
            const fileData = file.data as File;
            const compressedFile = await imageCompression(fileData, options);
            await new Promise((res) => setTimeout(res, 10));
            
            // Update the file with compressed data
            uppy.setFileState(fileID, {
              data: compressedFile,
              size: compressedFile.size,
              type: compressedFile.type,
            });
            
            setCompressingCount(prev => prev - 1);
          } catch (error) {
            console.error('Error compressing image:', error);
            setCompressingCount(prev => prev - 1);
          }
        }
      }
    });

    return uppy;
  }, []);

  // Set up event listeners
  React.useEffect(() => {
    const fileAddedHandler = () => {
      setTotalFiles(uppyInstance.getFiles().length);
    };

    const uploadProgressHandler = (_file: unknown, progress: { bytesUploaded: number; bytesTotal: number | null }) => {
      if (progress && progress.bytesTotal) {
        const progressPercentage = Math.floor((progress.bytesUploaded / progress.bytesTotal) * 100);
        setUploadProgress(progressPercentage);
        setUploadStatus(`Uploading: ${progressPercentage}%`);
      }
    };

    const completeHandler = (result: { successful?: Array<unknown>; failed?: Array<unknown>; response?: { body?: any } }) => {
      if (result && result.successful && result.successful.length > 0) {
        setUploadStatus(`Upload complete! ${result.successful.length} files uploaded successfully.`);
        
        console.log(result);
        // Update narratives with the server response
        if (result.successful[0] && (result.successful[0] as any).response.body.results) {
          setNarratives((result.successful[0] as any).response.body.results);
          
          // Redirect to the FilterPage after a short delay
          setTimeout(() => {
            navigate('/filter');
          }, 1000);
        }
      } else {
        setUploadStatus('Upload complete!');
      }
    };

    const errorHandler = (error: { message?: string }) => {
      setUploadStatus(`Error: ${error.message || 'Unknown error'}`);
    };

    // Add event listeners
    uppyInstance.on('file-added', fileAddedHandler);
    uppyInstance.on('upload-progress', uploadProgressHandler);
    uppyInstance.on('complete', completeHandler);
    uppyInstance.on('error', errorHandler);

    // Clean up
    return () => {
      uppyInstance.off('file-added', fileAddedHandler);
      uppyInstance.off('upload-progress', uploadProgressHandler);
      uppyInstance.off('complete', completeHandler);
      uppyInstance.off('error', errorHandler);
      // Cancel all uploads on unmount
      uppyInstance.cancelAll();
    };
  }, [uppyInstance, setNarratives, navigate]);

  const resetUppy = useCallback(() => {
    uppyInstance.cancelAll();
    // Reset Uppy by removing all files
    const files = uppyInstance.getFiles();
    files.forEach(file => uppyInstance.removeFile(file.id));
    
    setUploadProgress(0);
    setUploadStatus('');
    setTotalFiles(0);
  }, [uppyInstance]);

  const handleFilesSelected = (files: File[]) => {
    // Add each selected file to the Uppy instance
    files.forEach(file => {
      try {
        uppyInstance.addFile({
          name: file.name,
          type: file.type,
          data: file,
          source: 'local',
          isRemote: false,
        });
      } catch (error) {
        console.error('Error adding file to Uppy:', error);
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Upload your photos</h1>
      <p className="mb-4">Choose photos from your gallery to include in your album experience.</p>

      <div className="mb-4">
        <UploadButton onFilesSelected={handleFilesSelected} />
      </div>
      
      {compressingCount > 0 && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
          Compressing {compressingCount} images...
        </div>
      )}
      
      <div className="mb-6">
        <Dashboard
          uppy={uppyInstance}
          plugins={['Webcam']}
          metaFields={[
            { id: 'name', name: 'Name', placeholder: 'File name' }
          ]}
          showProgressDetails
          height={450}
          width="100%"
          note="Images will be compressed automatically before upload"
          proudlyDisplayPoweredByUppy={false}
          showSelectedFiles={false}
        />
      </div>
      
      {uploadStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          {uploadStatus}
        </div>
      )}
      
      <div className="flex space-x-4">
        <button 
          onClick={() => uppyInstance.upload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={totalFiles === 0 || compressingCount > 0}
        >
          Upload {totalFiles} Files
        </button>
        
        <button 
          onClick={resetUppy}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default UploadPage; 