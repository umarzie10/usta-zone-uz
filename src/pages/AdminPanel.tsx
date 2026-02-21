import { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { demoMasters, demoOrders } from '@/lib/demoData';
import {
  Users, ShoppingBag, Wallet, AlertTriangle, CheckCircle,
  XCircle, Shield, Settings, Search
} from 'lucide-react';

export default function AdminPanel() {
  const { t, showNotification } = useApp();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('masters');
  const [search, setSearch] = useState('');
  const [commission, setCommission] = useState('10');

  if (!user || !isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold mb-2">{t('noAccess')}</p>
            <p className="text-muted-foreground mb-4">{t('adminOnly')}</p>
            <Button onClick={() => navigate('/login')} className="rounded-xl btn-hero">{t('loginBtn')}</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'masters', label: t('allMasters'), icon: Users },
    { id: 'orders', label: t('allOrders'), icon: ShoppingBag },
    { id: 'withdrawals', label: t('withdrawRequests'), icon: Wallet },
    { id: 'disputes', label: t('disputes'), icon: AlertTriangle },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const filteredMasters = demoMasters.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black">{t('adminPanel')}</h1>
            <p className="text-muted-foreground text-sm">{t('managementPanel')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('totalMastersLabel'), value: demoMasters.length, icon: Users, color: 'text-primary' },
            { label: t('totalOrdersLabel'), value: demoOrders.length, icon: ShoppingBag, color: 'text-success' },
            { label: t('disputesLabel'), value: 0, icon: AlertTriangle, color: 'text-amber-500' },
            { label: t('commissionLabel'), value: '45.2K', icon: Wallet, color: 'text-purple-500' },
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

        {activeTab === 'masters' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 rounded-xl h-11" placeholder={t('searchMaster')} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="card-premium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      {[t('masterCol'), t('categoryCol'), t('cityCol'), t('ratingCol'), t('jobsCol'), t('balanceCol'), t('actionsCol')].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMasters.map(m => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-lg object-cover" />
                            <div>
                              <p className="font-medium">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{m.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.city}</td>
                        <td className="px-4 py-3"><span className="text-amber-500 font-semibold">★ {m.rating}</span></td>
                        <td className="px-4 py-3">{m.jobsCompleted}</td>
                        <td className="px-4 py-3 text-success font-medium">{(m.balance / 1000).toFixed(0)}K</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs gap-1">
                              <CheckCircle className="h-3 w-3 text-success" /> OK
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive">
                              <XCircle className="h-3 w-3" /> {t('block')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    {[t('orderCol'), t('clientCol'), t('paymentCol'), t('amountCol'), t('statusCol'), t('actionsCol')].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {demoOrders.map(o => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{o.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t('demoClient')}</td>
                      <td className="px-4 py-3">{o.paymentMethod === 'cash' ? t('cashLabel') : t('onlineLabel')}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{o.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          o.status === 'completed' ? 'bg-green-100 text-green-700' :
                          o.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{t(o.status === 'in_progress' ? 'inProgress' : o.status as any)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs">{t('viewBtn')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="card-premium p-8 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">{t('withdrawRequests')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('noWithdrawals')}</p>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="card-premium p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">{t('disputes')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('noDisputes')}</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card-premium p-6 max-w-md">
            <h3 className="font-bold mb-5">{t('platformSettings')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('commissionPercentage')}</label>
                <div className="flex gap-2 mt-1.5">
                  <Input className="rounded-xl h-11" type="number" value={commission}
                    onChange={e => setCommission(e.target.value)} />
                  <Button className="rounded-xl h-11 px-5" onClick={() => showNotification('success', t('commissionUpdated'))}>
                    {t('save')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('currentCommission')}: {commission}% {t('perOrder')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
