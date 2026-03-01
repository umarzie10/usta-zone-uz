import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ChatDialog from '@/components/ChatDialog';
import AvailabilityForm from '@/components/AvailabilityForm';
import PortfolioUpload from '@/components/PortfolioUpload';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, Star, MessageCircle, History, ArrowDownToLine, Briefcase, TrendingUp, Loader2, Clock, Camera, Image, User } from 'lucide-react';

export default function MasterDashboard() {
  const { t, showNotification } = useApp();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [masterProfile, setMasterProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ bio: '', skills: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: mp } = await supabase.from('master_profiles').select('*').eq('user_id', user!.id).single();
    setMasterProfile(mp);
    if (mp) {
      setProfileForm({ bio: mp.bio || '', skills: (mp.skills || []).join(', ') });
    }

    const { data: ords } = await supabase.from('orders').select('*').eq('master_id', user!.id).order('created_at', { ascending: false }).limit(20);
    setOrders(ords || []);

    const { data: revs } = await supabase.from('reviews').select('*').eq('master_id', user!.id).order('created_at', { ascending: false }).limit(10);
    if (revs && revs.length > 0) {
      const clientIds = revs.map(r => r.client_id);
      const { data: clients } = await supabase.from('profiles').select('user_id, full_name').in('user_id', clientIds);
      const cMap = new Map(clients?.map(c => [c.user_id, c.full_name]) || []);
      setReviews(revs.map(r => ({ ...r, client_name: cMap.get(r.client_id) || 'Mijoz' })));
    } else {
      setReviews([]);
    }

    const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20);
    setTransactions(txs || []);
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', user.id);
      showNotification('success', t('avatarUpdated'));
      refreshProfile();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !masterProfile) return;
    setSavingProfile(true);
    try {
      const skills = profileForm.skills.split(',').map(s => s.trim()).filter(Boolean);
      await supabase.from('master_profiles').update({
        bio: profileForm.bio || null,
        skills,
      }).eq('user_id', user.id);
      showNotification('success', t('profileUpdated'));
      setEditingProfile(false);
      fetchData();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">{t('loginRequired')}</p>
            <Button onClick={() => navigate('/login')} className="rounded-xl btn-hero">{t('loginBtn')}</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    setWithdrawing(true);
    try {
      await supabase.from('withdraw_requests').insert({
        master_id: user.id,
        amount: parseFloat(withdrawAmount),
        card_number: cardNumber,
        status: 'pending',
      });
      showNotification('success', t('withdrawRequested'));
      setWithdrawAmount('');
      setCardNumber('');
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const balance = masterProfile?.balance || 0;
  const withdrawable = masterProfile?.withdrawable_balance || 0;
  const completedJobs = orders.filter(o => o.status === 'completed').length;
  const avgRating = masterProfile?.rating || 0;
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=6366f1&color=fff&size=128`;

  const tabs = [
    { id: 'overview', label: t('overview'), icon: TrendingUp },
    { id: 'profile', label: t('editProfile'), icon: User },
    { id: 'portfolio', label: 'Portfolio', icon: Image },
    { id: 'schedule', label: t('workSchedule'), icon: Clock },
    { id: 'balance', label: t('myBalance'), icon: Wallet },
    { id: 'reviews', label: t('reviewsTab'), icon: Star },
    { id: 'history', label: t('history'), icon: History },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img src={avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              <label className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                {uploadingAvatar ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-black">{t('masterDashboard')}</h1>
              <p className="text-muted-foreground mt-1">{profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            {t('activeStatus')}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('completedJobs'), value: completedJobs, icon: Briefcase, color: 'text-primary' },
            { label: t('rating'), value: avgRating.toFixed(1), icon: Star, color: 'text-amber-500' },
            { label: `${t('balanceLabel')} (so'm)`, value: balance > 0 ? `${(balance / 1000000).toFixed(1)}M` : '0', icon: Wallet, color: 'text-success' },
            { label: t('withdraw'), value: withdrawable > 0 ? `${(withdrawable / 1000000).toFixed(1)}M` : '0', icon: ArrowDownToLine, color: 'text-purple-500' },
          ].map(s => (
            <div key={s.label} className="card-premium p-4">
              <s.icon className={`h-6 w-6 ${s.color} mb-2`} />
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="card-premium p-6">
              <h3 className="font-bold mb-4">{t('recentActivity')}</h3>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div>
                        <span className="text-sm font-medium">{order.title}</span>
                        <p className="text-xs text-muted-foreground">{order.status} • {order.amount?.toLocaleString()} so'm</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && masterProfile && (
          <div className="card-premium p-6 space-y-5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t('editProfile')}
            </h3>
            <div>
              <Label className="text-sm font-medium">{t('aboutMaster')}</Label>
              <Textarea
                value={profileForm.bio}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="O'zingiz haqingizda yozing..."
                className="mt-1.5 rounded-xl resize-none"
                rows={4}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t('skills')}</Label>
              <Input
                value={profileForm.skills}
                onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })}
                placeholder="Santexnik, Elektrik, Konditsioner..."
                className="mt-1.5 rounded-xl h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">Vergul bilan ajrating</p>
            </div>
            <Button className="w-full rounded-xl btn-hero" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('save')}
            </Button>
          </div>
        )}

        {activeTab === 'portfolio' && masterProfile && (
          <div className="card-premium p-6">
            <PortfolioUpload
              portfolioUrls={masterProfile.portfolio_urls || []}
              onUpdated={fetchData}
            />
          </div>
        )}

        {activeTab === 'schedule' && masterProfile && (
          <div className="card-premium p-6">
            <AvailabilityForm masterProfileId={masterProfile.id} />
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="space-y-5">
            <div className="card-premium p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{t('balanceLabel')}</h3>
                <span className="text-3xl font-black text-primary">{balance.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mb-6">
                <span>{t('withdrawableLabel')}</span>
                <span className="font-semibold text-success">{withdrawable.toLocaleString()} so'm</span>
              </div>
              <div className="space-y-4 border-t border-border pt-5">
                <h4 className="font-semibold">{t('withdraw')}</h4>
                <div>
                  <Label className="text-sm">{t('amountLabel')}</Label>
                  <Input className="mt-1.5 rounded-xl h-11" type="number" placeholder="500000"
                    value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">{t('cardNumber')}</Label>
                  <Input className="mt-1.5 rounded-xl h-11" placeholder="8600 0000 0000 0000"
                    value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                </div>
                <Button className="w-full h-11 rounded-xl btn-hero gap-2" onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount}>
                  {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                  {t('withdraw')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length > 0 ? reviews.map(r => (
              <div key={r.id} className="card-premium p-5">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{r.client_name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star key={j} className={`h-4 w-4 ${j < r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            )) : (
              <div className="card-premium p-8 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('noData')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card-premium p-6">
            <h3 className="font-bold mb-4">{t('transactionHistory')}</h3>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-bold ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} so'm
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
            )}
          </div>
        )}
      </div>

      <ChatDialog receiverId="demo-client" receiverName="Demo Client" open={chatOpen} onClose={() => setChatOpen(false)} />
    </Layout>
  );
}
