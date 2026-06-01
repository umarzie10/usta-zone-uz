import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, lat, lng } = await req.json();
    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "description required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load categories
    const { data: cats } = await supabase.from("categories").select("id, name_uz");
    const catList = (cats || []).map((c) => c.name_uz).join(", ");

    // Ask AI to classify + estimate
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Sen O'zbekistondagi uy xizmatlari AI yordamchisisan. Foydalanuvchi muammosini tahlil qil.
Mavjud kategoriyalar: ${catList}.
FAQAT JSON qaytar:
{"category":"<eng mos kategoriya nomi>","keywords":["kalit","so'zlar"],"min":80000,"max":200000,"reasoning":"qisqa izoh (1 jumla)"}`,
          },
          { role: "user", content: description },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI error");
    }
    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const m = content.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : { category: null, keywords: [], min: 80000, max: 200000, reasoning: "" };

    // Find matching category id
    const matchedCat = (cats || []).find(
      (c) => c.name_uz.toLowerCase() === String(parsed.category || "").toLowerCase()
    );

    // Query masters
    let q = supabase
      .from("master_profiles")
      .select("id, user_id, rating, reviews_count, jobs_completed, experience_years, bio, skills, category_ids")
      .eq("is_active", true)
      .eq("is_approved", true)
      .order("rating", { ascending: false })
      .limit(50);

    if (matchedCat) q = q.contains("category_ids", [matchedCat.id]);

    const { data: mps } = await q;
    let masters = mps || [];

    // Keyword filter (skills)
    const kws: string[] = (parsed.keywords || []).map((k: string) => k.toLowerCase());
    if (kws.length > 0) {
      const filtered = masters.filter((m) =>
        (m.skills || []).some((s: string) => kws.some((k) => s.toLowerCase().includes(k)))
      );
      if (filtered.length > 0) masters = filtered;
    }

    // Attach profiles
    const userIds = masters.map((m) => m.user_id);
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, city, region, latitude, longitude, is_verified")
      .in("user_id", userIds);
    const pmap = new Map((profs || []).map((p) => [p.user_id, p]));

    // Compute distance + score
    const haversine = (a: number, b: number, c: number, d: number) => {
      const R = 6371, toRad = (x: number) => (x * Math.PI) / 180;
      const dLat = toRad(c - a), dLng = toRad(d - b);
      const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    };

    const enriched = masters.map((m) => {
      const p = pmap.get(m.user_id) as any;
      const dist = lat && lng && p?.latitude && p?.longitude ? haversine(lat, lng, p.latitude, p.longitude) : null;
      const distScore = dist !== null ? Math.max(0, 50 - dist) : 25;
      const score = (m.rating || 0) * 10 + Math.min(m.jobs_completed || 0, 100) * 0.3 + distScore;
      return {
        id: m.id,
        user_id: m.user_id,
        rating: m.rating, reviews_count: m.reviews_count, jobs_completed: m.jobs_completed,
        experience_years: m.experience_years, bio: m.bio, skills: m.skills,
        full_name: p?.full_name || "Usta", avatar_url: p?.avatar_url, city: p?.city,
        is_verified: p?.is_verified || false,
        distance_km: dist !== null ? Math.round(dist * 10) / 10 : null,
        match_score: Math.round(score),
      };
    });

    enriched.sort((a, b) => b.match_score - a.match_score);

    return new Response(JSON.stringify({
      category: parsed.category,
      category_id: matchedCat?.id || null,
      keywords: parsed.keywords || [],
      price_min: parsed.min,
      price_max: parsed.max,
      reasoning: parsed.reasoning,
      masters: enriched.slice(0, 6),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
