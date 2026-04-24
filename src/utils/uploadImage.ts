import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Core utility to handle Supabase storage uploads across different buckets.
 */
const uploadToSupabase = async (
  file: Express.Multer.File, 
  folder: string, 
  bucketName: string
) => {
  const fileName = `${folder}/${uuidv4()}-${file.originalname}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  return data.path;
};

/**
 * Dedicated function for KYC documents and User Profiles.
 */
export const uploadImage = async (file: Express.Multer.File, folder: string) => {
  return uploadToSupabase(file, folder, 'kyc-documents');
};

/**
 * Dedicated function for Campaign Media.
 * Consolidating to 'kyc-documents' for new uploads, while maintaining 
 * bucket fallback in getSignedUrl for existing images.
 */
export const uploadCampaignMedia = async (file: Express.Multer.File, folder: string) => {
  return uploadToSupabase(file, folder, 'kyc-documents');
};

/**
 * Generate a signed URL for a file in Supabase Storage.
 * Includes fallback logic to support legacy buckets.
 */
export const getSignedUrl = async (bucket: string, filePath: string, expiresIn: number = 3600) => {
  if (!filePath) return null;

  // If it's already a full URL, return it as is
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // Clean path: strip leading slashes and redundant bucket names
  let cleanPath = filePath.replace(/^\/+/, '');
  if (cleanPath.startsWith(`${bucket}/`)) {
    cleanPath = cleanPath.replace(`${bucket}/`, '').replace(/^\/+/, '');
  }

  // Try the primary bucket first
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleanPath, expiresIn);

  if (error) {
    // FALLBACK: If not found in primary bucket, try 'campaign-media' (legacy)
    if (error.message === 'Object not found' && bucket !== 'campaign-media') {
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from('campaign-media')
        .createSignedUrl(cleanPath, expiresIn);
      
      if (!fallbackError && fallbackData) {
        return fallbackData.signedUrl;
      }
    }

    // Second FALLBACK: try 'kyc-documents' if we were looking elsewhere
    if (error.message === 'Object not found' && bucket !== 'kyc-documents') {
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(cleanPath, expiresIn);
      
      if (!fallbackError && fallbackData) {
        return fallbackData.signedUrl;
      }
    }

    console.error(`[Supabase Error] Bucket: ${bucket} | Path: ${cleanPath} | Error: ${error.message}`);
    return null;
  }

  return data.signedUrl;
};