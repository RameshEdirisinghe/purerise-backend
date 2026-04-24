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
 * Dedicated function for KYC documents.
 * Maintains backward compatibility with existing KYC controllers.
 */
export const uploadImage = async (file: Express.Multer.File, folder: string) => {
  return uploadToSupabase(file, folder, 'kyc-documents');
};

/**
 * Dedicated function for Campaign Media.
 * Uses the 'campaign-media' bucket.
 */
export const uploadCampaignMedia = async (file: Express.Multer.File, folder: string) => {
  return uploadToSupabase(file, folder, 'campaign-media');
};