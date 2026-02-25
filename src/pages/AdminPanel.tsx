import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, ShoppingBag, Wallet, AlertTriangle, CheckCircle,
  XCircle, Shield, Settings, Search, BarChart3, UserCheck,
  TrendingUp, Filter
} from 'lucide-react';

interface MasterRow {
  id: string;
  user_id: string;
  rating: number | null;
  reviews_count: number | null;
  jobs_completed: number | null;
  balance: number | null;
  is_approved: boolean | null;
  is_active: boolean | null;
  category_ids: string[] | null;
  full_name: string;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
}

interface OrderRow {
  id: string;
  title: string;
  amount: number | null;
  commission_amount: number | null;
  status: string;
  payment_method: string;
  created_at: string | null;
  client_name: string;
  master_name: string;
}

interface UserRow {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  role: string;
  avatar_url: string | null;
  is_verified: boolean | null;
  is_blocked: boolean | null;
  created_at: string | null;
}

export default function AdminPanel() {
  const { t, showNotification } = useApp();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('masters');
  const [search, setSearch] = useState('');
  const [commission, setCommission] = useState('10');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalMasters: 0, totalOrders: 0, totalUsers: 0, totalCommission: 0, disputes: 0 });

  useEffect(() => {
    if (user && isAdmin) fetchAllData();
  }, [user, isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMasters(), fetchOrders(), fetchUsers(), fetchWithdrawals(), fetchStats()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    const { data: mp } = await supabase.from('master_profiles').select('*');
    if (!mp || mp.length === 0) { setMasters([]); return; }
    const userIds = mp.map(m => m.user_id);
    const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    setMasters(mp.map(m => {
      const p = profileMap.get(m.user_id);
      return {
        id: m.id, user_id: m.user_id,
        rating: m.rating, reviews_count: m.reviews_count,
        jobs_completed: m.jobs_completed, balance: m.balance,
        is_approved: m.is_approved, is_active: m.is_active,
        category_ids: m.category_ids,
        full_name: p?.full_name || 'Noma\'lum',
        phone: p?.phone || null, city: p?.city || null,
        avatar_url: p?.avatar_url || null,
        is_verified: p?.is_verified || false,
      };
    }));
  };

  const fetchOrders = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!ords || ords.length === 0) { setOrders([]); return; }
    const allUserIds = [...new Set([...ords.map(o => o.client_id), ...ords.filter(o => o.master_id).map(o => o.master_id!)])];
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', allUserIds);
    const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
    setOrders(ords.map(o => ({
      id: o.id, title: o.title, amount: o.amount,
      commission_amount: o.commission_amount, status: o.status,
      payment_method: o.payment_method, created_at: o.created_at,
      client_name: nameMap.get(o.client_id) || 'Noma\'lum',
      master_name: o.master_id ? (nameMap.get(o.master_id) || 'Tayinlanmagan') : 'Tayinlanmagan',
    })));
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase.from('withdraw_requests').select('*').order('created_at', { ascending: false });
    setWithdrawals(data || []);
  };

  const fetchStats = async () => {
    const [{ count: mc }, { count: oc }, { count: uc }, { data: ords }] = await Promise.all([
      supabase.from('master_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('commission_amount, is_dispute'),
    ]);
    const totalComm = ords?.reduce((s, o) => s + (o.commission_amount || 0), 0) || 0;
    const disputes = ords?.filter(o => o.is_dispute).length || 0;
    setStats({ totalMasters: mc || 0, totalOrders: oc || 0, totalUsers: uc || 0, totalCommission: totalComm, disputes });
  };

  const handleApproveMaster = async (masterId: string, approve: boolean) => {
    await supabase.from('master_profiles').update({ is_approved: approve }).eq('id', masterId);
    showNotification('success', approve ? 'Usta tasdiqlandi!' : 'Usta rad etildi!');
    fetchMasters();
  };

  const handleBlockUser = async (userId: string, block: boolean) => {
    await supabase.from('profiles').update({ is_blocked: block }).eq('user_id', userId);
    showNotification('success', block ? 'Foydalanuvchi bloklandi!' : 'Blok olib tashlandi!');
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`"${userName}" foydalanuvchisini va barcha ma'lumotlarini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi!`)) return;
    try {
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
      if (error) throw error;
      showNotification('success', `"${userName}" muvaffaqiyatli o'chirildi!`);
      fetchAllData();
    } catch (err: any) {
      showNotification('error', `Xatolik: ${err.message}`);
    }
  };

  const handleWithdrawalAction = async (id: string, status: string) => {
    await supabase.from('withdraw_requests').update({ status }).eq('id', id);
    showNotification('success', `So'rov ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}!`);
    fetchWithdrawals();
  };

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
    { id: 'users', label: 'Foydalanuvchilar', icon: UserCheck },
    { id: 'withdrawals', label: t('withdrawRequests'), icon: Wallet },
    { id: 'analytics', label: 'Analitika', icon: BarChart3 },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const filteredMasters = masters.filter(m =>
    !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || (m.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    (statusFilter === 'all' || o.status === statusFilter) &&
    (!search || o.title.toLowerCase().includes(search.toLowerCase()) || o.client_name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredUsers = users.filter(u =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || (u.phone || '').includes(search)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'accepted': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-';

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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: t('totalMastersLabel'), value: stats.totalMasters, icon: Users, color: 'text-primary' },
            { label: t('totalOrdersLabel'), value: stats.totalOrders, icon: ShoppingBag, color: 'text-green-500' },
            { label: 'Foydalanuvchilar', value: stats.totalUsers, icon: UserCheck, color: 'text-blue-500' },
            { label: 'Munozaralar', value: stats.disputes, icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'Komissiya', value: `${(stats.totalCommission / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'text-purple-500' },
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
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* MASTERS TAB */}
            {activeTab === 'masters' && (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10 rounded-xl h-11" placeholder="Usta qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {filteredMasters.length === 0 ? (
                  <div className="card-premium p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold">Ustalar topilmadi</p>
                    <p className="text-sm text-muted-foreground mt-1">Hozircha ro'yxatdan o'tgan ustalar yo'q</p>
                  </div>
                ) : (
                  <div className="card-premium overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                          <tr>
                            {['Usta', 'Shahar', 'Reyting', 'Ishlar', 'Balans', 'Holat', 'Amallar'].map(h => (
                              <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMasters.map(m => (
                            <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=3b82f6&color=fff&size=32`}
                                    alt={m.full_name} className="w-8 h-8 rounded-lg object-cover" />
                                  <div>
                                    <p className="font-medium">{m.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{m.phone || '-'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{m.city || '-'}</td>
                              <td className="px-4 py-3"><span className="text-amber-500 font-semibold">★ {(m.rating || 0).toFixed(1)}</span></td>
                              <td className="px-4 py-3">{m.jobs_completed || 0}</td>
                              <td className="px-4 py-3 font-medium">{((m.balance || 0) / 1000).toFixed(0)}K</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {m.is_approved ? 'Tasdiqlangan' : 'Kutilmoqda'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1.5">
                                  {!m.is_approved && (
                                    <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs gap-1"
                                      onClick={() => handleApproveMaster(m.id, true)}>
                                      <CheckCircle className="h-3 w-3 text-green-500" /> Tasdiqlash
                                    </Button>
                                  )}
                                  {m.is_approved && (
                                    <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                                      onClick={() => handleApproveMaster(m.id, false)}>
                                      <XCircle className="h-3 w-3" /> Rad etish
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10 rounded-xl h-11" placeholder="Buyurtma qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <select className="rounded-xl border border-input bg-background px-3 h-11 text-sm"
                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Barchasi</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="accepted">Qabul qilingan</option>
                    <option value="in_progress">Bajarilmoqda</option>
                    <option value="completed">Bajarilgan</option>
                    <option value="cancelled">Bekor qilingan</option>
                  </select>
                </div>
                {filteredOrders.length === 0 ? (
                  <div className="card-premium p-8 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold">Buyurtmalar topilmadi</p>
                  </div>
                ) : (
                  <div className="card-premium overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                          <tr>
                            {['Buyurtma', 'Mijoz', 'Usta', 'To\'lov', 'Summa', 'Komissiya', 'Status', 'Sana'].map(h => (
                              <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map(o => (
                            <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium max-w-[200px] truncate">{o.title}</td>
                              <td className="px-4 py-3 text-muted-foreground">{o.client_name}</td>
                              <td className="px-4 py-3 text-muted-foreground">{o.master_name}</td>
                              <td className="px-4 py-3">{o.payment_method === 'cash' ? 'Naqd' : 'Onlayn'}</td>
                              <td className="px-4 py-3 font-semibold text-primary">{(o.amount || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-purple-500 font-medium">{(o.commission_amount || 0).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                                  {t(o.status === 'in_progress' ? 'inProgress' : o.status as any)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(o.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10 rounded-xl h-11" placeholder="Foydalanuvchi qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {filteredUsers.length === 0 ? (
                  <div className="card-premium p-8 text-center">
                    <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold">Foydalanuvchilar topilmadi</p>
                  </div>
                ) : (
                  <div className="card-premium overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                          <tr>
                            {['Foydalanuvchi', 'Telefon', 'Shahar', 'Rol', 'Holat', 'Sana', 'Amallar'].map(h => (
                              <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(u => (
                            <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=3b82f6&color=fff&size=32`}
                                    alt={u.full_name} className="w-8 h-8 rounded-lg object-cover" />
                                  <p className="font-medium">{u.full_name}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{u.phone || '-'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{u.city || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                  u.role === 'master' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>{u.role === 'admin' ? 'Admin' : u.role === 'master' ? 'Usta' : 'Mijoz'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  u.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>{u.is_blocked ? 'Bloklangan' : 'Aktiv'}</span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.created_at)}</td>
                              <td className="px-4 py-3">
                                {u.role !== 'admin' && (
                                  <div className="flex gap-1.5">
                                    <Button size="sm" variant="outline"
                                      className={`rounded-lg h-7 px-2 text-xs gap-1 ${u.is_blocked ? '' : 'text-destructive hover:text-destructive'}`}
                                      onClick={() => handleBlockUser(u.user_id, !u.is_blocked)}>
                                      {u.is_blocked ? <><CheckCircle className="h-3 w-3 text-green-500" /> Blokdan chiqarish</> : <><XCircle className="h-3 w-3" /> Bloklash</>}
                                    </Button>
                                    <Button size="sm" variant="outline"
                                      className="rounded-lg h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteUser(u.user_id, u.full_name)}>
                                      <XCircle className="h-3 w-3" /> O'chirish
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WITHDRAWALS TAB */}
            {activeTab === 'withdrawals' && (
              <div>
                {withdrawals.length === 0 ? (
                  <div className="card-premium p-8 text-center">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold">{t('withdrawRequests')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('noWithdrawals')}</p>
                  </div>
                ) : (
                  <div className="card-premium overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                          <tr>
                            {['Usta ID', 'Summa', 'Karta', 'Status', 'Sana', 'Amallar'].map(h => (
                              <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.map(w => (
                            <tr key={w.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs">{w.master_id.slice(0,8)}...</td>
                              <td className="px-4 py-3 font-semibold">{w.amount.toLocaleString()} so'm</td>
                              <td className="px-4 py-3 text-muted-foreground">{w.card_number || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(w.status)}`}>{w.status}</span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(w.created_at)}</td>
                              <td className="px-4 py-3">
                                {w.status === 'pending' && (
                                  <div className="flex gap-1.5">
                                    <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs gap-1"
                                      onClick={() => handleWithdrawalAction(w.id, 'approved')}>
                                      <CheckCircle className="h-3 w-3 text-green-500" /> Tasdiqlash
                                    </Button>
                                    <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs gap-1 text-destructive"
                                      onClick={() => handleWithdrawalAction(w.id, 'rejected')}>
                                      <XCircle className="h-3 w-3" /> Rad
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-premium p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Buyurtma statistikasi</h3>
                  <div className="space-y-3">
                    {['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map(status => {
                      const count = orders.filter(o => o.status === status).length;
                      const pct = orders.length ? (count / orders.length * 100) : 0;
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{t(status === 'in_progress' ? 'inProgress' : status as any)}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="card-premium p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Daromad</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Umumiy buyurtmalar summasi</p>
                      <p className="text-2xl font-black text-primary">{orders.reduce((s, o) => s + (o.amount || 0), 0).toLocaleString()} so'm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Platforma komissiyasi (10%)</p>
                      <p className="text-2xl font-black text-purple-500">{stats.totalCommission.toLocaleString()} so'm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bajarilgan buyurtmalar</p>
                      <p className="text-2xl font-black text-green-500">{orders.filter(o => o.status === 'completed').length}</p>
                    </div>
                  </div>
                </div>
                <div className="card-premium p-6">
                  <h3 className="font-bold mb-4">Shahar bo'yicha ustalar</h3>
                  <div className="space-y-2">
                    {Object.entries(masters.reduce((acc, m) => {
                      const city = m.city || 'Noma\'lum';
                      acc[city] = (acc[city] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => (
                      <div key={city} className="flex justify-between text-sm">
                        <span>{city}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                    {masters.length === 0 && <p className="text-sm text-muted-foreground">Hozircha ustalar yo'q</p>}
                  </div>
                </div>
                <div className="card-premium p-6">
                  <h3 className="font-bold mb-4">Rollar bo'yicha foydalanuvchilar</h3>
                  <div className="space-y-3">
                    {['client', 'master', 'admin'].map(role => {
                      const count = users.filter(u => u.role === role).length;
                      return (
                        <div key={role} className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${role === 'admin' ? 'bg-purple-500' : role === 'master' ? 'bg-blue-500' : 'bg-green-500'}`} />
                            {role === 'admin' ? 'Adminlar' : role === 'master' ? 'Ustalar' : 'Mijozlar'}
                          </span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
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
          </>
        )}
      </div>
    </Layout>
  );
}
