import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, X } from 'lucide-react';

interface ReviewFormProps {
  masterId: string; // user_id of master
  orderId: string;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ReviewForm({ masterId, orderId, open, onClose, onSubmitted }: ReviewFormProps) {
  const { t, showNotification } = useApp();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open || !user) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        master_id: masterId,
        client_id: user.id,
        order_id: orderId,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;

      // Update master's average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('master_id', masterId);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('master_profiles')
          .update({ rating: parseFloat(avg.toFixed(2)), reviews_count: reviews.length })
          .eq('user_id', masterId);
      }

      showNotification('success', t('reviewSubmitted'));
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">{t('rateThisMaster')}</h3>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Star rating */}
        <div className="mb-5">
          <p className="text-sm font-medium mb-2">{t('yourRating')}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-muted-foreground/30'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-5">
          <p className="text-sm font-medium mb-2">{t('yourComment')}</p>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('writeReview')}
            className="rounded-xl resize-none"
            rows={3}
          />
        </div>

        <Button
          className="w-full rounded-xl btn-hero"
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {t('submitReview')}
        </Button>
      </div>
    </div>
  );
}
