import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Loader2, Save, Pencil, X,
  FolderTree, ArrowUp, ArrowDown,
} from 'lucide-react';

interface Cat {
  id: string;
  name_uz: string;
  name_ru: string | null;
  name_en: string | null;
  icon: string | null;
  color: string | null;
  order_num: number | null;
  parent_id: string | null;
}

export default function AdminCategories() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_uz: '', name_ru: '', name_en: '', icon: 'wrench', color: '#1a56db' });
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Cat | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_num', { ascending: true, nullsFirst: false })
      .order('name_uz');
    if (error) toast.error(error.message);
    setCats((data as Cat[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const parents = cats.filter(c => !c.parent_id);
  const childrenOf = (id: string) => cats.filter(c => c.parent_id === id);

  const toggle = (id: string) => {
    const n = new Set(expanded);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpanded(n);
  };

  const openCreate = (parentId: string | null) => {
    setEditing(null);
    setNewParentId(parentId);
    const parent = parentId ? cats.find(c => c.id === parentId) : null;
    setForm({
      name_uz: '', name_ru: '', name_en: '',
      icon: parent?.icon || 'wrench',
      color: parent?.color || '#1a56db',
    });
    setDialogOpen(true);
  };
  const openEdit = (c: Cat) => {
    setEditing(c);
    setNewParentId(c.parent_id);
    setForm({
      name_uz: c.name_uz,
      name_ru: c.name_ru || c.name_uz,
      name_en: c.name_en || c.name_uz,
      icon: c.icon || 'wrench',
      color: c.color || '#1a56db',
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setNewParentId(null); };

  const save = async () => {
    if (!form.name_uz.trim()) return toast.error('Nom kiriting');
    setSaving(true);
    // for new items pick next order_num in the sibling group
    let order_num = editing?.order_num ?? undefined;
    if (!editing) {
      const siblings = newParentId ? childrenOf(newParentId) : parents;
      order_num = (siblings.reduce((m, s) => Math.max(m, s.order_num ?? 0), 0) + 1);
    }
    const payload = {
      name_uz: form.name_uz.trim(),
      name_ru: (form.name_ru || form.name_uz).trim(),
      name_en: (form.name_en || form.name_uz).trim(),
      icon: form.icon,
      color: form.color,
      parent_id: newParentId,
      ...(order_num !== undefined ? { order_num } : {}),
    };
    const { error } = editing
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? 'Yangilandi ✅' : 'Qo\'shildi ✅');
    closeDialog();
    load();
  };

  const confirmRemove = async () => {
    const c = confirmTarget;
    if (!c) return;
    setConfirmTarget(null);
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) { toast.error(`O'chirib bo'lmadi: ${error.message}`); return; }
    toast.success(`"${c.name_uz}" o'chirildi`);
    load();
  };

  const swapOrder = async (a: Cat, b: Cat) => {
    // swap using a two-step to avoid unique conflicts (none here, but safe)
    const aOrder = a.order_num ?? 0;
    const bOrder = b.order_num ?? 0;
    const { error: e1 } = await supabase.from('categories').update({ order_num: bOrder }).eq('id', a.id);
    const { error: e2 } = await supabase.from('categories').update({ order_num: aOrder }).eq('id', b.id);
    if (e1 || e2) { toast.error('Tartibni o\'zgartirib bo\'lmadi'); return; }
    // optimistic local update
    setCats(prev => prev.map(c =>
      c.id === a.id ? { ...c, order_num: bOrder } :
      c.id === b.id ? { ...c, order_num: aOrder } : c
    ));
  };

  const move = (list: Cat[], item: Cat, dir: -1 | 1) => {
    const idx = list.findIndex(x => x.id === item.id);
    const nb = list[idx + dir];
    if (!nb) return;
    swapOrder(item, nb);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Kategoriyalar</h3>
          <span className="text-xs text-muted-foreground">
            ({parents.length} asosiy, {cats.length - parents.length} sub)
          </span>
        </div>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => openCreate(null)}>
          <Plus className="h-4 w-4" /> Yangi kategoriya
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="card-premium divide-y">
          {parents.map((p, pi) => {
            const kids = childrenOf(p.id);
            const open = expanded.has(p.id);
            return (
              <div key={p.id}>
                <div className="flex items-center gap-1.5 p-3 hover:bg-muted/40 transition">
                  <button onClick={() => toggle(p.id)} className="p-1 rounded hover:bg-muted shrink-0" aria-label="toggle">
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="w-7 h-7 rounded-lg shrink-0" style={{ background: p.color || '#1a56db' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name_uz}</div>
                    <div className="text-[11px] text-muted-foreground">{kids.length} sub</div>
                  </div>
                  <div className="flex flex-col -space-y-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-5 w-6 p-0" disabled={pi === 0}
                      onClick={() => move(parents, p, -1)} aria-label="Yuqoriga">
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-5 w-6 p-0" disabled={pi === parents.length - 1}
                      onClick={() => move(parents, p, 1)} aria-label="Pastga">
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => openCreate(p.id)}>
                    <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sub</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p)} aria-label="Tahrirlash">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive"
                    onClick={() => setConfirmTarget(p)} aria-label="O'chirish">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {open && kids.length > 0 && (
                  <div className="bg-muted/20 pl-10 pr-3 py-1 divide-y divide-border/40">
                    {kids.map((k, ki) => (
                      <div key={k.id} className="flex items-center gap-1.5 py-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: k.color || '#1a56db' }} />
                        <div className="flex-1 text-sm truncate">{k.name_uz}</div>
                        <div className="flex flex-col -space-y-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-5 w-6 p-0" disabled={ki === 0}
                            onClick={() => move(kids, k, -1)} aria-label="Yuqoriga">
                            <ArrowUp className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-5 w-6 p-0" disabled={ki === kids.length - 1}
                            onClick={() => move(kids, k, 1)} aria-label="Pastga">
                            <ArrowDown className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(k)} aria-label="Tahrirlash">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                          onClick={() => setConfirmTarget(k)} aria-label="O'chirish">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={closeDialog}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold">
                {editing ? 'Tahrirlash' : newParentId ? 'Yangi subkategoriya' : 'Yangi kategoriya'}
              </h4>
              <button onClick={closeDialog} className="p-1 rounded hover:bg-muted" aria-label="Yopish">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Nomi (UZ)</Label>
                <Input className="mt-1 rounded-xl" value={form.name_uz}
                  onChange={e => setForm({ ...form, name_uz: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>RU</Label>
                  <Input className="mt-1 rounded-xl" value={form.name_ru}
                    onChange={e => setForm({ ...form, name_ru: e.target.value })} />
                </div>
                <div>
                  <Label>EN</Label>
                  <Input className="mt-1 rounded-xl" value={form.name_en}
                    onChange={e => setForm({ ...form, name_en: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Icon</Label>
                  <Input className="mt-1 rounded-xl" value={form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="wrench" />
                </div>
                <div>
                  <Label>Rang</Label>
                  <Input type="color" className="mt-1 rounded-xl h-10 p-1" value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })} />
                </div>
              </div>
              <Button className="w-full rounded-xl gap-2" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Saqlash
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget && (childrenOf(confirmTarget.id).length > 0
                ? `"${confirmTarget.name_uz}" va uning ${childrenOf(confirmTarget.id).length} ta subkategoriyasi butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.`
                : `"${confirmTarget?.name_uz}" o'chiriladi. Bu amalni bekor qilib bo'lmaydi.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ha, o'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
