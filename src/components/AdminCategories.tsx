import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Loader2, Save, Pencil, X, FolderTree,
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
  const { showNotification } = useApp();
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_uz: '', name_ru: '', name_en: '', icon: 'wrench', color: '#1a56db' });
  const [saving, setSaving] = useState(false);


  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('order_num').order('name_uz');
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
  };
  const closeDialog = () => { setEditing(null); setNewParentId(null); };

  const save = async () => {
    if (!form.name_uz.trim()) return showNotification('error', 'Nom kiriting');
    setSaving(true);
    const payload = {
      name_uz: form.name_uz.trim(),
      name_ru: (form.name_ru || form.name_uz).trim(),
      name_en: (form.name_en || form.name_uz).trim(),
      icon: form.icon,
      color: form.color,
      parent_id: newParentId,
    };
    const { error } = editing
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (error) return showNotification('error', error.message);
    showNotification('success', editing ? 'Yangilandi' : 'Qo\'shildi');
    closeDialog();
    load();
  };

  const remove = async (c: Cat) => {
    const kids = childrenOf(c.id).length;
    const msg = kids
      ? `"${c.name_uz}" va uning ${kids} ta subkategoriyasini o'chirilsinmi?`
      : `"${c.name_uz}" o'chirilsinmi?`;
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) return showNotification('error', error.message);
    showNotification('success', 'O\'chirildi');
    load();
  };

  const isOpen = editing !== null || newParentId !== null || (editing === null && newParentId === null && false);
  const showForm = editing !== null || newParentId !== undefined && (newParentId !== null || (editing === null && (form.name_uz !== '' || false)));

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
          {parents.map(p => {
            const kids = childrenOf(p.id);
            const open = expanded.has(p.id);
            return (
              <div key={p.id}>
                <div className="flex items-center gap-2 p-3 hover:bg-muted/40 transition">
                  <button onClick={() => toggle(p.id)} className="p-1 rounded hover:bg-muted">
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="w-7 h-7 rounded-lg shrink-0" style={{ background: p.color || '#1a56db' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name_uz}</div>
                    <div className="text-[11px] text-muted-foreground">{kids.length} sub</div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => openCreate(p.id)}>
                    <Plus className="h-3.5 w-3.5" /> Sub
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => remove(p)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {open && kids.length > 0 && (
                  <div className="bg-muted/20 pl-10 pr-3 py-1 divide-y divide-border/40">
                    {kids.map(k => (
                      <div key={k.id} className="flex items-center gap-2 py-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: k.color || '#1a56db' }} />
                        <div className="flex-1 text-sm truncate">{k.name_uz}</div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(k)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(k)}>
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

      {(editing !== null || newParentId !== null || (editing === null && newParentId === null && form.name_uz === '__' )) && false}

      {(editing || newParentId !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeDialog}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold">
                {editing ? 'Tahrirlash' : newParentId ? 'Yangi subkategoriya' : 'Yangi kategoriya'}
              </h4>
              <button onClick={closeDialog} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
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
    </div>
  );
}
