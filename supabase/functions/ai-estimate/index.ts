import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Sen O'zbekistondagi uy xizmatlari narxlarini taxmin qiluvchi AI yordamchisan.
Foydalanuvchi muammo tavsifini yozadi, sen narx oralig'ini so'mda taxmin qilasan.
O'zbekistondagi real narxlarni hisobga ol:
- Santexnik ishlari: 50,000 - 300,000 so'm
- Elektrik ishlari: 40,000 - 250,000 so'm
- Konditsioner: 100,000 - 500,000 so'm
- Tozalash: 80,000 - 400,000 so'm
- Mebel yig'ish: 60,000 - 350,000 so'm
- Ta'mirlash: 100,000 - 2,000,000 so'm

Javobni FAQAT JSON formatida ber:
{"min": 80000, "max": 150000, "description": "qisqa izoh"}

Boshqa hech narsa yozma, faqat JSON.`
          },
          {
            role: "user",
            content: `Kategoriya: ${category || "Noma'lum"}\nMuammo: ${description}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const estimate = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(estimate), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ min: 80000, max: 200000, description: "Taxminiy narx" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-estimate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
