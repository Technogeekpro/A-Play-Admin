import { supabase } from "@/integrations/supabase/client";

export interface UploadFileOptions {
  bucket: string;
  folder?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export const uploadFile = async (
  file: File,
  options: UploadFileOptions
): Promise<UploadResult> => {
  const {
    bucket,
    folder = "",
    maxSizeInMB = 5,
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  } = options;

  try {
    // Validate file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeInMB}MB`);
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported`);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error: any) {
    return {
      url: "",
      path: "",
      error: error.message
    };
  }
};

export const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

export const getFileUrl = (bucket: string, path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return publicUrl;
}; 