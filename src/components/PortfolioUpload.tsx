import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Image, Plus, Trash2, Loader2, X, Upload } from 'lucide-react';

interface PortfolioUploadProps {
  portfolioUrls: string[];
  onUpdated: () => void;
}

export default function PortfolioUpload({ portfolioUrls, onUpdated }: PortfolioUploadProps) {
  const { t, showNotification } = useApp();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from('portfolio').upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }

      const allUrls = [...portfolioUrls, ...newUrls];
      await supabase
        .from('master_profiles')
        .update({ portfolio_urls: allUrls })
        .eq('user_id', user.id);

      showNotification('success', `${newUrls.length} ta rasm yuklandi`);
      onUpdated();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (url: string) => {
    if (!user) return;
    setDeleting(url);
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/portfolio/');
      if (pathParts.length > 1) {
        await supabase.storage.from('portfolio').remove([pathParts[1]]);
      }

      const newUrls = portfolioUrls.filter(u => u !== url);
      await supabase
        .from('master_profiles')
        .update({ portfolio_urls: newUrls })
        .eq('user_id', user.id);

      showNotification('success', "Rasm o'chirildi");
      onUpdated();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          Portfolio
          <span className="text-sm font-normal text-muted-foreground">({portfolioUrls.length} ta rasm)</span>
        </h3>
        <label>
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 cursor-pointer" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Rasm qo'shish
            </span>
          </Button>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Drag & drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">Rasmlarni shu yerga tashlang yoki yuqoridagi tugmani bosing</p>
      </div>

      {portfolioUrls.length === 0 ? (
        <div className="text-center py-6">
          <Image className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Hozircha portfolio rasmlari yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {portfolioUrls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
              <img
                src={url}
                alt={`Portfolio ${i + 1}`}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setLightboxImg(url)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                onClick={() => handleDelete(url)}
                disabled={deleting === url}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {deleting === url ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}/{portfolioUrls.length}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxImg(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={lightboxImg} alt="Portfolio" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
