import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

export const uploadImage = async (file: Express.Multer.File, folder: string) => {
  const fileName = `${folder}/${uuidv4()}-${file.originalname}`;

  const { data, error } = await supabase.storage
    .from('kyc-documents') // bucket name
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data.path;
};