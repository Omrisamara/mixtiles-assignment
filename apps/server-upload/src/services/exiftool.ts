import { ImageTakenLocation, ImageTakenTime } from '../imageProcessor.js';
import exifReader from 'exif-reader';

interface ExifImage {
  Make?: string;
  Model?: string;
  Orientation?: number;
  XResolution?: number;
  YResolution?: number;
  ResolutionUnit?: number;
  Software?: string;
  DateTime?: Date;
  HostComputer?: string;
  YCbCrPositioning?: number;
  ExifTag?: number;
  [key: string]: any; // Allow for additional properties
}

interface ExifPhoto {
  ExposureTime?: number;
  FNumber?: number;
  ExposureProgram?: number;
  ISOSpeedRatings?: number;
  ExifVersion?: Uint8Array;
  DateTimeOriginal?: Date;
  DateTimeDigitized?: Date;
  OffsetTime?: string;
  OffsetTimeOriginal?: string;
  OffsetTimeDigitized?: string;
  ComponentsConfiguration?: Uint8Array;
  ShutterSpeedValue?: number;
  ApertureValue?: number;
  BrightnessValue?: number;
  ExposureBiasValue?: number;
  MeteringMode?: number;
  Flash?: number;
  FocalLength?: number;
  SubjectArea?: number[];
  MakerNote?: Uint8Array;
  SubSecTimeOriginal?: string;
  SubSecTimeDigitized?: string;
  FlashpixVersion?: Uint8Array;
  ColorSpace?: number;
  PixelXDimension?: number;
  PixelYDimension?: number;
  SensingMethod?: number;
  SceneType?: Uint8Array;
  ExposureMode?: number;
  WhiteBalance?: number;
  FocalLengthIn35mmFilm?: number;
  SceneCaptureType?: number;
  LensSpecification?: number[];
  LensMake?: string;
  LensModel?: string;
  CompositeImage?: number;
  [key: string]: any; // Allow for additional properties
}

interface ExifGps {
  GPSLatitude?: number[];
  GPSLatitudeRef?: string;
  GPSLongitude?: number[];
  GPSLongitudeRef?: string;
  GPSAltitude?: number;
  GPSAltitudeRef?: number;
  GPSSpeedRef?: string;
  GPSSpeed?: number;
  GPSImgDirectionRef?: string;
  GPSImgDirection?: number;
  GPSDestBearingRef?: string;
  GPSDestBearing?: number;
  GPSHPositioningError?: number;
  [key: string]: any;
}

interface ExifData {
  Image?: ExifImage;
  Photo?: ExifPhoto;
  gps?: ExifGps;
  GPSInfo?: ExifGps;
  [key: string]: any;
}

export class Exiftool {
  async getImagesTakenTimeAndLocation(files: Express.Multer.File[]): Promise<[ImageTakenTime[], ImageTakenLocation[]]> {
    const takenTimes: ImageTakenTime[] = [];
    const takenLocations: ImageTakenLocation[] = [];
    
    for (const file of files) {
      try {
        // Use the buffer directly from the Multer file object
        const exifData = await this.getExifData(file.buffer);
        
        if (exifData) {
          // Extract time information
          const timeData = this.extractTimeData(exifData, file.originalname);
          if (timeData) {
            takenTimes.push(timeData);
          }
          
          // Extract location information
          const locationData = this.extractLocationData(exifData, file.originalname);
          if (locationData) {
            takenLocations.push(locationData);
          }
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
      }
    }
    
    return [takenTimes, takenLocations];
  }

  private getExifData(imageBuffer: Buffer): Promise<ExifData | null> {
    return new Promise((resolve) => {
      try {
        let offset = 0;
        while (offset < imageBuffer.length) {
          if (imageBuffer[offset] === 0xFF && imageBuffer[offset + 1] === 0xE1) {
            offset += 4;
            const exifBuffer = imageBuffer.slice(offset);
            const rawExifData = exifReader(exifBuffer);
            resolve(rawExifData as unknown as ExifData);
            return;
          }
          offset++;
        }
        resolve(null);
      } catch (error) {
        resolve(null);
      }
    });
  }
  
  private extractTimeData(exifData: ExifData, filename: string): ImageTakenTime | null {
    try {
      // Try to get date/time from various EXIF fields
      const dateTimeOriginal = exifData.Photo?.DateTimeOriginal || 
                             exifData.Image?.DateTime;
      
      if (dateTimeOriginal) {
        return {
          filename,
          takenTime: dateTimeOriginal instanceof Date ? dateTimeOriginal : new Date(dateTimeOriginal),
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error extracting time data for ${filename}:`, error);
      return null;
    }
  }
  
  private extractLocationData(exifData: ExifData, filename: string): ImageTakenLocation | null {
    try {
      const gps = exifData.GPSInfo || exifData.gps;
      if (gps?.GPSLatitude && gps?.GPSLongitude && gps.GPSLatitudeRef && gps.GPSLongitudeRef) {
        const latitude = this.convertGpsCoordinate(gps.GPSLatitude, gps.GPSLatitudeRef);
        const longitude = this.convertGpsCoordinate(gps.GPSLongitude, gps.GPSLongitudeRef);
        
        return {
          filename,
          location: {
            lat: latitude,
            lng: longitude,
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error extracting location data for ${filename}:`, error);
      return null;
    }
  }
  
  private convertGpsCoordinate(coordinates: number[], ref: string): number {
    // Convert GPS coordinates from [degrees, minutes, seconds] format to decimal
    const degrees = coordinates[0];
    const minutes = coordinates[1];
    const seconds = coordinates[2];
    
    let decimal = degrees + (minutes / 60) + (seconds / 3600);
    
    // If southern or western hemisphere, make the coordinate negative
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  }
} 