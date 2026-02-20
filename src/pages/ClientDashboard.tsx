import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { demoOrders } from '@/lib/demoData';
import {
  ShoppingBag, MessageCircle, Star, Wallet, Plus,
  Clock, CheckCircle, AlertCircle, XCircle, ArrowUpRight
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Kutilmoqda', icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  accepted: { label: 'Qabul qilindi', icon: CheckCircle, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'Bajarilmoqda', icon: AlertCircle, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  completed: { label: 'Bajarildi', icon: CheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Bekor qilindi', icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  disputed: { label: 'Munozarali', icon: AlertCircle, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
};

export default function ClientDashboard() {
  const { t } = useApp();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">Tizimga kiring</p>
            <Button onClick={() => navigate('/login')} className="rounded-xl btn-hero">Kirish</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'orders', label: t('activeOrders'), icon: ShoppingBag },
    { id: 'messages', label: t('messages'), icon: MessageCircle },
    { id: 'reviews', label: 'Sharhlar', icon: Star },
    { id: 'balance', label: 'Balans', icon: Wallet },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Mijoz kabineti</h1>
            <p className="text-muted-foreground mt-1">{profile?.full_name || user.email}</p>
          </div>
          <Button
            className="rounded-xl btn-hero gap-2"
            onClick={() => navigate('/find-master')}
          >
            <Plus className="h-4 w-4" />
            Buyurtma berish
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Jami buyurtmalar', value: demoOrders.length, icon: ShoppingBag, color: 'text-primary' },
            { label: 'Faol', value: 1, icon: Clock, color: 'text-amber-500' },
            { label: 'Bajarilgan', value: 1, icon: CheckCircle, color: 'text-success' },
            { label: 'Xabarlar', value: 3, icon: MessageCircle, color: 'text-purple-500' },
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
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {demoOrders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
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
                        {order.paymentMethod === 'cash' ? 'Naqd' : 'Onlayn'}
                      </p>
                    </div>
                  </div>
                  {order.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-border flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
                        <Star className="h-3.5 w-3.5" />
                        Baholash
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-xl gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Xabar
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
            <p className="font-semibold mb-1">Xabarlar bo'limi</p>
            <p className="text-sm text-muted-foreground">Usta bilan muloqot qilish uchun buyurtma bering</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="card-premium p-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Sharhlarim</p>
            <p className="text-sm text-muted-foreground">Siz hali hech qanday sharh qoldirmadingiz</p>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Mening balansim</h3>
              <span className="text-3xl font-black text-primary">0 so'm</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Qaytarilgan to'lovlar va online to'lovlar bu yerda ko'rinadi.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
