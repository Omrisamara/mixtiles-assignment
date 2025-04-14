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
// Using dynamic imports for ESM modules
// import { Server } from '@tus/server';
// import { FileStore } from '@tus/file-store';
import path from 'path';
import fs from 'fs';

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

// Setup TUS server
const uploadDir = path.resolve('apps/server-upload/src/uploads');
// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

process.on('uncaughtException', (err: any) => {
  if (err.code === 'ECONNRESET') {
    console.warn('Global ECONNRESET — ignored');
  } else {
    console.error('UNCAUGHT EXCEPTION 🔥', err);
    process.exit(1); // optional: remove this if you want to survive crashes
  }
});

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('UNHANDLED PROMISE REJECTION 🔥', reason);
// });

// Initialize TUS server dynamically
let tusServer: any = null;
(async () => {
  try {
    const { Server } = await import('@tus/server');
    const { FileStore } = await import('@tus/file-store');
    
    tusServer = new Server({
      path: '/uploads',
      datastore: new FileStore({
        directory: uploadDir
      }),
      respectForwardedHeaders: true,
      // namingFunction: (req) => {
      //   // Generate a unique ID for the file
      //   return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      // }
    });
    
    console.log('TUS server initialized successfully');
  } catch (error) {
    console.error('Failed to initialize TUS server:', error);
  }
})();

// Handle TUS protocol routes
app.all('/uploads', (req, res) => {
  try {
    if (tusServer) {
      console.log('TUS server found');
      tusServer.handle(req, res);
  } else {
      res.status(503).json({ message: 'Upload server is initializing. Please try again shortly.' });
    }
  } catch (error: any) {
    if (error.code === "ECONNRESET") {
      console.warn('ECONNRESET received');
    } else {
      console.error('Failed to handle TUS request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

app.all('/uploads/*', (req, res) => {
  try {
    if (tusServer) {
      console.log('TUS server found2');
      tusServer.handle(req, res);
  } else {
      res.status(503).json({ message: 'Upload server is initializing. Please try again shortly.' });
    }
  } catch (error: any) {
    if (error.code === "ECONNRESET") {
      console.warn('ECONNRESET received');
    } else {
      console.error('Failed to handle TUS request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Create a finalize endpoint to handle uploaded files
app.post('/api/finalize-upload', express.json(), async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        message: 'No file IDs provided'
      });
    }
    
    console.log(`📥 Finalizing ${fileIds.length} uploaded files`);
    
    // Collect all files from storage
    const files: Express.Multer.File[] = [];
    for (const fileId of fileIds) {
      try {
        const filePath = path.join(uploadDir, fileId);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const fileName = fileId.split('-').pop() || fileId;
          
          // Create a structure compatible with Express.Multer.File
          files.push({
            fieldname: 'files',
            originalname: fileName,
            encoding: '7bit',
            mimetype: 'image/jpeg', // Assuming these are images
            destination: uploadDir,
            filename: fileId,
            path: filePath,
            size: fileBuffer.length,
            buffer: fileBuffer,
            stream: null as any // Required by type but not used by the processor
          });
          
          console.log(`Processed file: ${fileName}, size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
        }
      } catch (error) {
        console.error(`Error processing file ${fileId}:`, error);
      }
    }
    
    if (files.length === 0) {
      return res.status(400).json({
        message: 'No valid files found'
      });
    }
    
    // Process images using the imageProcessor
    // const results: any[] = [];
    const results = await imageProcessor.processImages(files);
    
    // Return successful response with results
    return res.status(200).json({ 
      message: 'Files processed successfully', 
      results,
    });
  } catch (error: any) {
    console.error('Error handling finalize upload:', error);
    return res.status(500).json({ 
      message: 'Error processing files',
      error: error.message 
    });
  }
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
      return res.status(200).json({ 
        message: 'Files processed successfully', 
        results,
      });
    } else {
      return res.status(400).json({
        message: 'No files received',
      });
    }
  } catch (error: any) {
    console.error('Error handling file upload:', error);
    return res.status(500).json({ 
      message: 'Error processing files',
      error: error.message 
    });
  }
});

// Add a simple status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

const server =app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

server.maxConnections = 1000;
