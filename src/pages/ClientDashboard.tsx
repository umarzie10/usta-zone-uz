import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ChatDialog from '@/components/ChatDialog';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { demoOrders } from '@/lib/demoData';
import {
  ShoppingBag, MessageCircle, Star, Wallet, Plus,
  Clock, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';

export default function ClientDashboard() {
  const { t } = useApp();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatReceiver, setChatReceiver] = useState({ id: '', name: '' });

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
            { label: t('totalOrdersLabel'), value: demoOrders.length, icon: ShoppingBag, color: 'text-primary' },
            { label: t('activeLabel'), value: 1, icon: Clock, color: 'text-amber-500' },
            { label: t('completedLabel'), value: 1, icon: CheckCircle, color: 'text-success' },
            { label: t('messagesLabel'), value: 3, icon: MessageCircle, color: 'text-purple-500' },
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

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {demoOrders.map((order) => {
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
                        <span>{order.category}</span>
                        <span>•</span>
                        <span>{order.master}</span>
                        <span>•</span>
                        <span>{order.date}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">{order.amount.toLocaleString()} so'm</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.paymentMethod === 'cash' ? t('cashLabel') : t('onlineLabel')}
                      </p>
                    </div>
                  </div>
                  {order.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-border flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
                        <Star className="h-3.5 w-3.5" />
                        {t('rateBtn')}
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-xl gap-1.5"
                        onClick={() => openChat('m1', order.master)}>
                        <MessageCircle className="h-3.5 w-3.5" />
                        {t('messageBtn')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
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
          <div className="card-premium p-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">{t('myReviews')}</p>
            <p className="text-sm text-muted-foreground">{t('noReviewsYet')}</p>
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
      </div>

      <ChatDialog
        receiverId={chatReceiver.id}
        receiverName={chatReceiver.name}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </Layout>
  );
}
