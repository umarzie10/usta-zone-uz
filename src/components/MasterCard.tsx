import { DemoMaster } from '@/lib/demoData';
import { useApp } from '@/contexts/AppContext';
import { Star, MapPin, CheckCircle, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface MasterCardProps {
  master: DemoMaster;
  compact?: boolean;
}

export default function MasterCard({ master, compact = false }: MasterCardProps) {
  const { t } = useApp();
  const navigate = useNavigate();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
      />
    ));
  };

  return (
    <div
      className="card-premium p-5 hover-lift cursor-pointer group"
      onClick={() => navigate(`/master/${master.id}`)}
    >
      {/* Header */}
      <div className="flex gap-3 mb-4">
        <div className="relative shrink-0">
          <img
            src={master.avatar}
            alt={master.name}
            className="w-16 h-16 rounded-2xl object-cover"
          />
          {master.isTopMaster && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
              style={{ background: 'var(--gradient-accent)' }}>★</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-tight truncate">{master.name}</h3>
            {master.isVerified && (
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
            )}
          </div>
          <p className="text-xs text-primary font-medium mb-1.5">{master.category}</p>
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center gap-0.5">{renderStars(master.rating)}</div>
            <span className="text-xs font-semibold text-amber-500">{master.rating}</span>
            <span className="text-xs text-muted-foreground">({master.reviewsCount})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{master.city}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!compact && (
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl bg-muted/50">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{master.jobsCompleted}</p>
            <p className="text-[10px] text-muted-foreground">{t('jobs')}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-sm font-bold text-foreground">{master.experience}y</p>
            <p className="text-[10px] text-muted-foreground">Tajriba</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-primary">
              {(master.pricePerHour / 1000).toFixed(0)}K
            </p>
            <p className="text-[10px] text-muted-foreground">so'm/soat</p>
          </div>
        </div>
      )}

      {/* Skills */}
      {!compact && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {master.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-[10px] py-0 px-2">
              {skill}
            </Badge>
          ))}
          {master.skills.length > 3 && (
            <Badge variant="secondary" className="text-[10px] py-0 px-2">
              +{master.skills.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 rounded-xl text-xs gap-1.5"
          onClick={(e) => { e.stopPropagation(); navigate(`/master/${master.id}`); }}
        >
          {t('hire')}
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="rounded-xl h-8 w-8 shrink-0"
          onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${master.phone}`; }}
        >
          <Phone className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="rounded-xl h-8 w-8 shrink-0"
          onClick={(e) => { e.stopPropagation(); navigate(`/messages?master=${master.id}`); }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
