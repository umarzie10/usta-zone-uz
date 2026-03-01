import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Image, Plus, Trash2, Loader2, X } from 'lucide-react';

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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

      showNotification('success', t('portfolioUpdated'));
      onUpdated();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (url: string) => {
    if (!user) return;
    setDeleting(url);
    try {
      // Extract path from URL
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

      showNotification('success', t('delete'));
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
        </h3>
        <label>
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 cursor-pointer" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t('addPhoto')}
            </span>
          </Button>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      <p className="text-sm text-muted-foreground">{t('portfolioDesc')}</p>

      {portfolioUrls.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
          <Image className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('noPortfolioYet')}</p>
          <label className="mt-3 inline-block">
            <Button size="sm" className="rounded-xl gap-1.5 cursor-pointer btn-hero" asChild>
              <span>
                <Plus className="h-4 w-4" /> {t('addPhoto')}
              </span>
            </Button>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {portfolioUrls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
              <img
                src={url}
                alt={`Portfolio ${i + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightboxImg(url)}
              />
              <button
                onClick={() => handleDelete(url)}
                disabled={deleting === url}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {deleting === url ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
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
