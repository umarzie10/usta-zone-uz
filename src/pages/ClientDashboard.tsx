import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ChatDialog from '@/components/ChatDialog';
import ReviewForm from '@/components/ReviewForm';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag, MessageCircle, Star, Wallet, Plus,
  Clock, CheckCircle, AlertCircle, XCircle, Loader2
} from 'lucide-react';

interface OrderWithMaster {
  id: string;
  title: string;
  status: string;
  amount: number;
  payment_method: string;
  created_at: string;
  master_id: string | null;
  master_name: string;
  category_name: string;
}

export default function ClientDashboard() {
  const { t } = useApp();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatReceiver, setChatReceiver] = useState({ id: '', name: '' });
  const [orders, setOrders] = useState<OrderWithMaster[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<{ masterId: string; orderId: string } | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    // Orders
    const { data: ords } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', user!.id)
      .order('created_at', { ascending: false });

    if (ords && ords.length > 0) {
      const masterIds = [...new Set(ords.map(o => o.master_id).filter(Boolean))] as string[];
      let mMap = new Map<string, string>();
      if (masterIds.length > 0) {
        const { data: masterProfiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', masterIds);
        mMap = new Map((masterProfiles || []).map(p => [p.user_id, p.full_name] as [string, string]));
      }

      setOrders(ords.map(o => ({
        id: o.id, title: o.title, status: o.status,
        amount: o.amount || 0, payment_method: o.payment_method,
        created_at: o.created_at || '', master_id: o.master_id,
        master_name: o.master_id ? (mMap.get(o.master_id) || 'Usta') : '—',
        category_name: '',
      })));
    } else {
      setOrders([]);
    }

    // Reviews by this client
    const { data: revs } = await supabase.from('reviews').select('*').eq('client_id', user!.id).order('created_at', { ascending: false });
    setReviews(revs || []);

    setLoading(false);
  };

  const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    pending: { label: t('pending'), icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    accepted: { label: t('accepted'), icon: CheckCircle, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    in_progress: { label: t('inProgress'), icon: AlertCircle, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    completed: { label: t('completed'), icon: CheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    cancelled: { label: t('cancelled'), icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    disputed: { label: t('disputed'), icon: AlertCircle, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
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

  const completedCount = orders.filter(o => o.status === 'completed').length;
  const activeCount = orders.filter(o => ['pending', 'accepted', 'in_progress'].includes(o.status)).length;

  const tabs = [
    { id: 'orders', label: t('activeOrders'), icon: ShoppingBag },
    { id: 'messages', label: t('messages'), icon: MessageCircle },
    { id: 'reviews', label: t('reviewsTab'), icon: Star },
    { id: 'balance', label: t('balanceTab'), icon: Wallet },
  ];

  const openChat = (masterId: string, masterName: string) => {
    setChatReceiver({ id: masterId, name: masterName });
    setChatOpen(true);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">{t('clientDashboard')}</h1>
            <p className="text-muted-foreground mt-1">{profile?.full_name || user.email}</p>
          </div>
          <Button className="rounded-xl btn-hero gap-2" onClick={() => navigate('/find-master')}>
            <Plus className="h-4 w-4" />
            {t('placeOrder')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('totalOrdersLabel'), value: orders.length, icon: ShoppingBag, color: 'text-primary' },
            { label: t('activeLabel'), value: activeCount, icon: Clock, color: 'text-amber-500' },
            { label: t('completedLabel'), value: completedCount, icon: CheckCircle, color: 'text-success' },
            { label: t('messagesLabel'), value: reviews.length, icon: Star, color: 'text-purple-500' },
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

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.length > 0 ? orders.map(order => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div key={order.id} className="card-premium p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{order.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{order.master_name}</span>
                            <span>•</span>
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-primary">{order.amount.toLocaleString()} so'm</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.payment_method === 'cash' ? t('cashLabel') : t('onlineLabel')}
                          </p>
                        </div>
                      </div>
                      {order.status === 'completed' && order.master_id && (
                        <div className="mt-3 pt-3 border-t border-border flex gap-2">
                          <Button size="sm" variant="outline" className="rounded-xl gap-1.5"
                            onClick={() => setReviewTarget({ masterId: order.master_id!, orderId: order.id })}>
                            <Star className="h-3.5 w-3.5" />
                            {t('rateBtn')}
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-xl gap-1.5"
                            onClick={() => openChat(order.master_id!, order.master_name)}>
                            <MessageCircle className="h-3.5 w-3.5" />
                            {t('messageBtn')}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="card-premium p-8 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold mb-1">{t('noData')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="card-premium p-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold mb-1">{t('messagesSection')}</p>
                <p className="text-sm text-muted-foreground">{t('clientMessagesDesc')}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length > 0 ? reviews.map(r => (
                  <div key={r.id} className="card-premium p-5">
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }, (_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                )) : (
                  <div className="card-premium p-8 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold mb-1">{t('myReviews')}</p>
                    <p className="text-sm text-muted-foreground">{t('noReviewsYet')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'balance' && (
              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">{t('myBalance')}</h3>
                  <span className="text-3xl font-black text-primary">0 so'm</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('balanceDesc')}</p>
              </div>
            )}
          </>
        )}
      </div>

      <ChatDialog
        receiverId={chatReceiver.id}
        receiverName={chatReceiver.name}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {reviewTarget && (
        <ReviewForm
          masterId={reviewTarget.masterId}
          orderId={reviewTarget.orderId}
          open={true}
          onClose={() => setReviewTarget(null)}
          onSubmitted={fetchData}
        />
      )}
    </Layout>
  );
}
