import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `Sen UstaZone platformasining yordamchisisan. UstaZone — O'zbekistondagi ustalar (santexnik, elektrik, quruvchi va h.k.) va mijozlarni bog'lovchi onlayn platforma.
Qoidalar:
- Faqat o'zbek tilida, qisqa va aniq javob ber.
- Foydalanuvchiga buyurtma berish, usta topish, tariflar, balans (hamyon), kafolat va escrow to'lov bo'yicha yordam ber.
- Narxni aniq va'da qilma, faqat taxminiy oraliq ayt.
- Javoblarni markdown bilan formatla.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'AI sozlanmagan' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages majburiy' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'system', content: SYSTEM }, ...messages.slice(-20)],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`AI gateway error [${res.status}]: ${body}`);
      const msg = res.status === 429
        ? "So'rovlar juda ko'p — biroz kuting."
        : res.status === 402
        ? 'AI limiti tugadi.'
        : 'AI xatosi';
      return new Response(JSON.stringify({ error: msg, details: body }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-assistant error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Xatolik' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
