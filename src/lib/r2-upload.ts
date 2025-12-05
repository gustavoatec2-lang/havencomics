import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  storage?: 'r2' | 'supabase';
}

// Upload to Supabase Storage as fallback
async function uploadToSupabaseStorage(
  file: File,
  path: string
): Promise<UploadResult> {
  try {
    const { data, error } = await supabase.storage
      .from('manga-content')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('manga-content')
      .getPublicUrl(path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      storage: 'supabase',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro no upload Supabase';
    return { success: false, error: errorMessage };
  }
}

export async function uploadToR2(
  file: File,
  path: string,
  onProgress?: (progress: string) => void
): Promise<UploadResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Não autenticado' };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await supabase.functions.invoke('r2-upload', {
      body: formData,
    });

    if (response.error) {
      console.warn('R2 upload failed, trying Supabase storage fallback:', response.error.message);
      return uploadToSupabaseStorage(file, path);
    }

    if (response.data?.error) {
      console.warn('R2 upload failed, trying Supabase storage fallback:', response.data.error);
      return uploadToSupabaseStorage(file, path);
    }

    return {
      success: true,
      url: response.data.url,
      path: response.data.path,
      storage: 'r2',
    };
  } catch (error) {
    console.warn('R2 upload exception, trying Supabase storage fallback:', error);
    // Fallback to Supabase storage
    return uploadToSupabaseStorage(file, path);
  }
}

export async function uploadChapterPages(
  files: File[],
  mangaSlug: string,
  chapterNumber: number,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<{ success: boolean; urls: string[]; error?: string }> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `chapters/${mangaSlug}/cap-${chapterNumber}/page-${String(i + 1).padStart(3, '0')}.${ext}`;
    
    onProgress?.(i + 1, files.length, file.name);

    const result = await uploadToR2(file, path);
    
    if (!result.success) {
      return { success: false, urls, error: result.error };
    }
    
    urls.push(result.url!);
  }

  return { success: true, urls };
}

export async function uploadCoverImage(
  file: File,
  mangaSlug: string
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `covers/${mangaSlug}/cover.${ext}`;
  return uploadToR2(file, path);
}

export async function uploadBannerImage(
  file: File,
  mangaSlug: string
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `banners/${mangaSlug}/banner.${ext}`;
  return uploadToR2(file, path);
}
