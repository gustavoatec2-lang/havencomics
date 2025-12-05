import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
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
      return { success: false, error: response.error.message };
    }

    if (response.data?.error) {
      return { success: false, error: response.data.error };
    }

    return {
      success: true,
      url: response.data.url,
      path: response.data.path,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
    return { success: false, error: errorMessage };
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
