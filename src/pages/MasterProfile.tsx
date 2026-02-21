import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ChatDialog from '@/components/ChatDialog';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { demoMasters } from '@/lib/demoData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Star, MapPin, CheckCircle, Phone, MessageCircle, Calendar,
  Briefcase, Clock, ArrowLeft, Share2, Heart
} from 'lucide-react';

export default function MasterProfilePage() {
  const { id } = useParams();
  const { t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const master = demoMasters.find(m => m.id === id) || demoMasters[0];

  const renderStars = (rating: number, size = 'md') => {
    const sz = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${sz} ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
    ));
  };

  const demoReviews = [
    { author: "Abdullayev Sherzod", rating: 5, date: "2024-01-10", text: "Juda yaxshi usta! Ishi tez va sifatli. Albatta yana chaqiraman." },
    { author: "Karimova Malika", rating: 5, date: "2024-01-05", text: "Professional yondashuv, vaqtida keldi, hamma narsani tushuntirib berdi. Tavsiya qilaman!" },
    { author: "Rahimov Bobur", rating: 4, date: "2023-12-28", text: "Yaxshi usta, lekin biroz kech keldi. Ishi sifatli." },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6 rounded-xl gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Main info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card-premium p-6">
              <div className="flex gap-5">
                <div className="relative shrink-0">
                  <img src={master.avatar} alt={master.name}
                    className="w-28 h-28 rounded-2xl object-cover shadow-md" />
                  {master.isTopMaster && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: 'var(--gradient-accent)' }}>★</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h1 className="text-2xl font-black">{master.name}</h1>
                      <p className="text-primary font-semibold">{master.category}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl shrink-0">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">{renderStars(master.rating, 'lg')}</div>
                    <span className="font-bold text-amber-500">{master.rating}</span>
                    <span className="text-muted-foreground text-sm">({master.reviewsCount} {t('reviews')})</span>
                    {master.isVerified && (
                      <span className="badge-verified ml-1">
                        <CheckCircle className="h-3 w-3" /> {t('verified')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {master.city}, {master.region}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {master.experience} {t('yearsExperience')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Briefcase, label: t('completedJobs'), value: master.jobsCompleted },
                { icon: Star, label: t('averageRating'), value: master.rating },
                { icon: Clock, label: t('experienceYears'), value: master.experience },
              ].map(s => (
                <div key={s.label} className="card-premium p-4 text-center">
                  <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            <div className="card-premium p-6">
              <h3 className="font-bold text-lg mb-3">{t('aboutMaster')}</h3>
              <p className="text-muted-foreground leading-relaxed">{master.bio}</p>
            </div>

            {/* Skills */}
            <div className="card-premium p-6">
              <h3 className="font-bold text-lg mb-4">{t('skills')}</h3>
              <div className="flex flex-wrap gap-2">
                {master.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1.5 rounded-xl text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="card-premium p-6">
              <h3 className="font-bold text-lg mb-4">{t('reviewsTitle')} ({master.reviewsCount})</h3>
              <div className="space-y-4">
                {demoReviews.map((review, i) => (
                  <div key={i}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{review.author}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: 5 }, (_, j) => (
                            <Star key={j} className={`h-3 w-3 ${j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Contact */}
          <div className="space-y-4">
            <div className="card-premium p-6 sticky top-20">
              <div className="text-center mb-5">
                <p className="text-muted-foreground text-sm mb-1">{t('hourlyRate')}</p>
                <p className="text-3xl font-black text-primary">
                  {master.pricePerHour.toLocaleString()} so'm
                </p>
                <p className="text-xs text-muted-foreground">{t('perHourLabel')}</p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-12 rounded-xl btn-hero gap-2 text-base font-semibold"
                  onClick={() => navigate(`/order/create?master=${master.id}`)}
                >
                  <Calendar className="h-5 w-5" />
                  {t('hire')}
                </Button>

                <a href={`tel:${master.phone}`} className="block">
                  <Button variant="outline" className="w-full h-11 rounded-xl gap-2 font-semibold">
                    <Phone className="h-4 w-4" />
                    {t('callMaster')}
                  </Button>
                </a>

                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl gap-2 font-semibold"
                  onClick={() => {
                    if (!user) { navigate('/login'); return; }
                    setChatOpen(true);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('message')}
                </Button>

                <Button variant="ghost" className="w-full h-10 rounded-xl gap-2 text-sm">
                  <Share2 className="h-4 w-4" />
                  {t('share')}
                </Button>
              </div>

              <Separator className="my-5" />

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('phoneLabel')}</span>
                  <span className="font-medium">{master.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cityLabel')}</span>
                  <span className="font-medium">{master.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('experienceLabel')}</span>
                  <span className="font-medium">{master.experience} {t('yearsExperience')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('statusLabel')}</span>
                  <span className="text-success font-medium">{t('activeStatus')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatDialog
        receiverId={master.id}
        receiverName={master.name}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </Layout>
  );
}
