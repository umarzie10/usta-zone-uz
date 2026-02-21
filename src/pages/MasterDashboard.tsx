import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ChatDialog from '@/components/ChatDialog';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { demoMasters } from '@/lib/demoData';
import { Wallet, Star, MessageCircle, History, ArrowDownToLine, Briefcase, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function MasterDashboard() {
  const { t, showNotification } = useApp();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const master = demoMasters[0];

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

  const tabs = [
    { id: 'overview', label: t('overview'), icon: TrendingUp },
    { id: 'balance', label: t('myBalance'), icon: Wallet },
    { id: 'messages', label: t('messages'), icon: MessageCircle },
    { id: 'reviews', label: t('reviewsTab'), icon: Star },
    { id: 'history', label: t('history'), icon: History },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">{t('masterDashboard')}</h1>
            <p className="text-muted-foreground mt-1">{profile?.full_name || master.name}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            {t('activeStatus')}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('completedJobs'), value: master.jobsCompleted, icon: Briefcase, color: 'text-primary' },
            { label: t('rating'), value: master.rating, icon: Star, color: 'text-amber-500' },
            { label: `${t('balanceLabel')} (so'm)`, value: `${(master.balance / 1000000).toFixed(1)}M`, icon: Wallet, color: 'text-success' },
            { label: t('withdraw'), value: `${(master.withdrawable / 1000000).toFixed(1)}M`, icon: ArrowDownToLine, color: 'text-purple-500' },
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
              <div className="space-y-3">
                {[
                  { text: t('newOrderNotif'), time: `2 ${t('hoursAgo')}`, type: "new" },
                  { text: t('paymentReceived'), time: `1 ${t('dayAgo')}`, type: "payment" },
                  { text: t('newReviewNotif'), time: `2 ${t('daysAgo')}`, type: "review" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <span className="text-sm">{item.text}</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="space-y-5">
            <div className="card-premium p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{t('balanceLabel')}</h3>
                <span className="text-3xl font-black text-primary">{master.balance.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mb-6">
                <span>{t('withdrawableLabel')}</span>
                <span className="font-semibold text-success">{master.withdrawable.toLocaleString()} so'm</span>
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

        {activeTab === 'messages' && (
          <div className="card-premium p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">{t('messagesSection')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('masterMessagesDesc')}</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {[
              { author: "Abdullayev Sherzod", rating: 5, text: "Juda yaxshi usta!", date: "2024-01-10" },
              { author: "Karimova Malika", rating: 5, text: "Professional yondashuv!", date: "2024-01-05" },
            ].map((r, i) => (
              <div key={i} className="card-premium p-5">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{r.author}</span>
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star key={j} className={`h-4 w-4 ${j < r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card-premium p-6">
            <h3 className="font-bold mb-4">{t('transactionHistory')}</h3>
            <div className="space-y-3">
              {[
                { desc: "Buyurtma #1023 - to'lov", amount: +135000, date: "2024-01-15" },
                { desc: `${t('commission')} (10%)`, amount: -15000, date: "2024-01-15" },
                { desc: t('withdraw'), amount: -500000, date: "2024-01-10" },
              ].map((tx, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{tx.desc}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={`font-bold ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} so'm
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ChatDialog
        receiverId="demo-client"
        receiverName="Demo Client"
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </Layout>
  );
}
