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
import pLimit from 'p-limit';
import Compressor from '@uppy/compressor';
export function UploadPage() {
  const { setNarratives } = useContext(AppContext);
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [compressingCount, setCompressingCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

    uppy.use(Compressor, {
      quality: 0.5
    });

    // Use XHRUpload for uploading files
    uppy.use(XHRUpload, {
      endpoint: 'http://10.0.0.11:4000/api/upload', // Replace with your server endpoint
      formData: true,
      fieldName: 'files',
      bundle: true,
    });

    // Add a preprocessor for image conversion and compression
    // uppy.addPreProcessor(async (fileIDs) => {
    //   const limit = pLimit(4); // Limit concurrent operations to 4
      
    //   // Create an array of promises for parallel processing
    //   const processingPromises = fileIDs.map(fileID => limit(async () => {
    //     const file = uppy.getFile(fileID);
        
    //     // Handle HEIC conversion first
    //     if (file && (file.type === 'image/heic' || file.type === 'image/heif' || file.name?.toLowerCase().endsWith('.heic'))) {
    //       try {
    //         setCompressingCount(prev => prev + 1);
    //         setUploadStatus(`Converting HEIC image ${file.name?.toString() || 'unknown'} to JPEG...`);
            
    //         // Cast to File to ensure compatibility
    //         const fileData = file.data as File;
            
    //         // Convert HEIC to JPEG
    //         const jpegBlob = await heic2any({
    //           blob: fileData,
    //           toType: 'image/jpeg',
    //           quality: 0.5
    //         }) as Blob;
            
    //         // Create a new file with JPEG extension
    //         const newFileName = file.name?.replace(/\.[^/.]+$/, '') + '.jpg';
    //         const jpegFile = new File([jpegBlob], newFileName, { type: 'image/jpeg' });
            
    //         // Update the file with converted data
    //         uppy.setFileState(fileID, {
    //           data: jpegFile,
    //           name: newFileName,
    //           type: jpegFile.type,
    //           size: jpegFile.size,
    //         });
            
    //         setCompressingCount(prev => prev - 1);
    //       } catch (error) {
    //         console.error('Error converting HEIC image:', error);
    //         setCompressingCount(prev => prev - 1);
    //       }
    //     }
    //     // Now handle compression for JPEG and PNG
    //     else if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
    //       try {
    //         setCompressingCount(prev => prev + 1);
    //         setUploadStatus(`Compressing image ${file.name?.toString() || 'unknown'}...`);
            
    //         const options = {
    //           maxSizeMB: 0.3,
    //           maxWidthOrHeight: 1600,
    //           useWebWorker: true,
    //           preserveExif: true,
    //         };

    //         // Cast to File to ensure compatibility
    //         const fileData = file.data as File;
    //         const compressedFile = await imageCompression(fileData, options);
    //         await new Promise((res) => setTimeout(res, 10));
            
    //         // Update the file with compressed data
    //         uppy.setFileState(fileID, {
    //           data: compressedFile,
    //           size: compressedFile.size,
    //           type: compressedFile.type,
    //         });
            
    //         setCompressingCount(prev => prev - 1);
    //       } catch (error) {
    //         console.error('Error compressing image:', error);
    //         setCompressingCount(prev => prev - 1);
    //       }
    //     }
    //   }));

    //   // Wait for all files to be processed
    //   await Promise.all(processingPromises);
    // });

    return uppy;
  }, []);

  // Set up event listeners
  React.useEffect(() => {
    const fileAddedHandler = () => {
      setTotalFiles(uppyInstance.getFiles().length);
    };

    const uploadStartHandler = () => {
      setIsUploading(true);
    };

    const uploadProgressHandler = (_file: unknown, progress: { bytesUploaded: number; bytesTotal: number | null }) => {
      if (progress && progress.bytesTotal) {
        const progressPercentage = Math.floor((progress.bytesUploaded / progress.bytesTotal) * 100);
        setUploadProgress(progressPercentage);
        setUploadStatus(`Uploading: ${progressPercentage}%`);
      }
    };

    const completeHandler = (result: { successful?: Array<unknown>; failed?: Array<unknown>; response?: { body?: any } }) => {
      setIsUploading(false);
      
      if (result && result.successful && result.successful.length > 0) {
        setUploadStatus(`Upload complete! ${result.successful.length} files uploaded successfully.`);
        
        console.log(result);
        // Update narratives with the server response
        if (result.successful[0] && (result.successful[0] as any).response.body.results) {
          setNarratives((result.successful[0] as any).response.body.results);
          
          // Redirect to the FilterPage after a short delay
          navigate('/filter');
        }
      } else {
        setUploadStatus('Upload complete!');
      }
    };

    const errorHandler = (error: { message?: string }) => {
      setIsUploading(false);
      setUploadStatus(`Error: ${error.message || 'Unknown error'}`);
    };

    // Add event listeners
    uppyInstance.on('file-added', fileAddedHandler);
    uppyInstance.on('upload-start', uploadStartHandler);
    uppyInstance.on('upload-progress', uploadProgressHandler);
    uppyInstance.on('complete', completeHandler);
    uppyInstance.on('error', errorHandler);

    // Clean up
    return () => {
      uppyInstance.off('file-added', fileAddedHandler);
      uppyInstance.off('upload-start', uploadStartHandler);
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
    setIsUploading(false);
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image visuals */}
      <div className="absolute inset-0 -z-10 opacity-100">
        {/* Featured image visual */}
        <div className="mb-4">
          <div className="p-[100px] bg-gradient-to-r from-indigo-200 to-purple-200 flex items-center justify-center relative">
            <svg className="w-20 h-40 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            </svg>
          </div>
        </div>

        {/* More gallery visuals */}
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`bg-row2-${i}`} className="aspect-square bg-gradient-to-tr from-purple-100 to-indigo-100">
              <svg className="w-10 h-10 text-indigo-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
              </svg>
            </div>
          ))}
        </div>
      </div>
      
      {/* White gradient overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/90 -z-5"></div>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Upload Your Photos</h1>
          <div className="w-20 h-1 bg-indigo-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Choose photos from your gallery to create your personalized album experience.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-100 rounded-full transform -rotate-6 scale-110 opacity-50"></div>
            <div className="relative z-10">
              <UploadButton onFilesSelected={handleFilesSelected} />
            </div>
          </div>
        </div>

        {totalFiles > 0 && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center bg-indigo-50 px-4 py-2 rounded-full">
              <span className="inline-block w-3 h-3 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-indigo-700 font-medium">{totalFiles} files selected</span>
            </div>
          </div>
        )}
        
        {/* Visual indicator for upload progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-6">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">{uploadProgress}% complete</p>
          </div>
        )}
        
        {uploadStatus && (
          <div className="mb-6 p-4 bg-white bg-opacity-70 backdrop-blur-sm border border-indigo-100 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              <p className="text-indigo-700">{uploadStatus}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          {/* <Dashboard
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
          /> */}
        </div>
        
        {/* <div className="flex space-x-4">
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
        </div> */}
      </div>

      {/* Custom loading modal with animation */}
      {(compressingCount > 0 || isUploading) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 m-4 sm:m-8 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 relative mb-6">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-t-4 border-indigo-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {compressingCount > 0 ? "Processing Images" : "Uploading Images"}
              </h3>
              {/* TODO: remove before production */}
              <p className="text-gray-600 text-center mb-2">
                {uploadStatus}
              </p>
              <p className="text-gray-600 text-center mb-2">
                {compressingCount > 0 
                  ? "Converting and optimizing your photos for the best experience." 
                  : "Uploading your photos to create your personalized album."}
              </p>
              {isUploading && uploadProgress > 0 && (
                <div className="w-full mt-2 mb-4">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-indigo-600 mt-1 text-center">{uploadProgress}% complete</p>
                </div>
              )}
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage; 