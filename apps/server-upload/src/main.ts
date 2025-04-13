import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { ImageProcessor } from './imageProcessor.js';
import { GoogleVisionApi } from './services/googleVisionApi.js';
import { OpenaiApi } from './services/openaiApi.js';
import { Exiftool } from './services/exiftool.js';
import { ClusterApi } from './services/clusterApi.js';
import { ClusterProcessor } from './services/clusterProcessor.js';
import { serviceAccount } from './gsa.js';
import dotenv from 'dotenv';
import { GoogleCloudStorage } from './services/googleCloudStorage.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 4000;

// Initialize all dependencies
const googleVisionApi = new GoogleVisionApi(serviceAccount);
const openaiApi = new OpenaiApi(process.env.OPENAI_API_KEY || '');
const exiftool = new Exiftool();
const clusterApi = new ClusterApi(process.env.PYTHON_CLUSTER_SERVICE_URL || 'http://localhost:5000');
const clusterProcessor = new ClusterProcessor();
const googleCloudStorage = new GoogleCloudStorage(process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '', serviceAccount);
// Initialize the ImageProcessor with all its dependencies
const imageProcessor = new ImageProcessor(
  googleVisionApi,
  openaiApi,
  exiftool,
  clusterApi,
  clusterProcessor,
  googleCloudStorage
);

// Configure CORS to allow requests from the client
app.use(cors());

// Use memory storage to avoid saving files to disk
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit to match client
});

// Handle file uploads from Uppy
app.post('/api/upload', upload.array('files', 1000), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    console.log(`📥 Received ${files?.length} files`);
    // Log file info but don't store files
    if (files && files.length > 0) {
      files.forEach((file: Express.Multer.File) => {
        console.log(`Processed file: ${file.originalname}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      });
      
      // Process images using the imageProcessor
      const results = await imageProcessor.processImages(files);
      
      // Return successful response with results
      res.status(200).json({ 
        message: 'Files processed successfully', 
        results,
      });
    } else {
      res.status(400).json({
        message: 'No files received',
      });
    }
  } catch (error: any) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ 
      message: 'Error processing files',
      error: error.message 
    });
  }
});

// Add a simple status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});