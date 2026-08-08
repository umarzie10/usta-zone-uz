import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Qanday buyurtma beraman?',
  'Escrow to‘lov nima?',
  'Usta tariflari qanday?',
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Salom! Men UstaZone yordamchisiman 👋 Sizga qanday yordam bera olaman?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { messages: next.map(({ role, content }) => ({ role, content })) },
      });
      if (error) throw error;
      setMessages([...next, { role: 'assistant', content: data?.content || 'Javob olinmadi.' }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Kechirasiz, hozir javob bera olmadim. Birozdan so‘ng urinib ko‘ring.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI yordamchi"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl grid place-items-center hover-scale transition-transform"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-[380px] z-50 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-in-up">
          <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold text-sm">UstaZone AI yordamchi</span>
          </div>

          <div className="max-h-[50vh] min-h-[220px] overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Yozmoqda...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs rounded-full border border-border px-3 py-1 hover:bg-muted transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2 border-t border-border p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Savolingizni yozing..."
              className="flex-1 bg-transparent text-sm px-2 py-2 outline-none"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="h-9 w-9 grid place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
