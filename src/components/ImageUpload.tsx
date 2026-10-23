import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, X, Check } from 'lucide-react';

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  aspectRatio?: string;
  bucket?: string;
  folder?: string;
};

function stripCacheBust(url: string): string {
  return url.replace(/[?&]v=[^&]*/, '').replace(/[?&]$/, '');
}

function extractStoragePath(url: string, folder: string): string | null {
  const marker = `/object/public/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const afterMarker = url.substring(idx + marker.length);
  const slashIdx = afterMarker.indexOf('/');
  if (slashIdx === -1) return null;
  const path = afterMarker.substring(slashIdx + 1);
  return stripCacheBust(path);
}

export default function ImageUpload({
  value,
  onChange,
  label,
  aspectRatio = 'aspect-[3/4]',
  bucket = 'images',
  folder = 'covers',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  const uploadFile = async (file: File) => {
    setError('');
    setUploading(true);

    try {
      const basePath = value
        ? extractStoragePath(value, folder)
        : null;

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = basePath
        ? `${basePath}`
        : `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: 'no-cache',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath, { download: false });
      const bust = Date.now();
      const newUrl = `${stripCacheBust(data.publicUrl)}?v=${bust}`;

      setPreviewUrl(newUrl);
      onChange(newUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const clearImage = () => {
    onChange('');
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayUrl = previewUrl || value;

  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {displayUrl ? (
        <div className="relative group">
          <div className={`relative ${aspectRatio} max-w-[200px] rounded-lg border border-ink-200 overflow-hidden bg-ink-100`}>
            <img
              key={displayUrl}
              src={displayUrl}
              alt="Preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = displayUrl.split('?')[0];
              }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
              </div>
            )}
            {!uploading && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-white"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={clearImage}
                  className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                >
                  <X className="h-3.5 w-3.5 inline" />
                </button>
              </div>
            )}
          </div>
          {!uploading && (
            <p className="mt-1.5 text-xs text-ink-400 flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" /> Image saved — click to replace
            </p>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`relative ${aspectRatio} max-w-[200px] rounded-lg border-2 border-dashed border-ink-300 bg-ink-50 flex flex-col items-center justify-center cursor-pointer hover:border-ink-500 hover:bg-ink-100 transition-colors`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-ink-400 mb-1.5" />
              <span className="text-xs text-ink-500 text-center px-2">Click to upload or drag & drop</span>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
