import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ==========================================
// MERCHANT ID LARNI SHU YERGA YOZING
// ==========================================
const CLICK_MERCHANT_ID = ''; // Click merchant ID
const CLICK_SERVICE_ID = ''; // Click service ID
const CLICK_SECRET_KEY = ''; // Click secret key
const PAYME_MERCHANT_ID = ''; // Payme merchant ID
const PAYME_MERCHANT_KEY = ''; // Payme merchant key
// ==========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;
    const { orderId, provider, amount } = await req.json();

    if (!orderId || !provider || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields: orderId, provider, amount' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!['click', 'payme'].includes(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid provider. Must be "click" or "payme"' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify order exists and belongs to this user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('client_id', userId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Calculate commission (10%)
    const commission = amount * 0.1;
    const masterAmount = amount - commission;

    let paymentUrl = '';
    let paymentId = '';

    if (provider === 'click') {
      // Click UZ integration
      if (CLICK_MERCHANT_ID && CLICK_SERVICE_ID) {
        paymentUrl = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amount}&transaction_param=${orderId}`;
        paymentId = `click_${Date.now()}`;
      } else {
        paymentId = `click_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }
    } else if (provider === 'payme') {
      // Payme integration
      if (PAYME_MERCHANT_ID) {
        const encodedParams = btoa(JSON.stringify({
          m: PAYME_MERCHANT_ID,
          ac: { order_id: orderId },
          a: amount * 100, // Payme uses tiyin (1 so'm = 100 tiyin)
        }));
        paymentUrl = `https://checkout.paycom.uz/${encodedParams}`;
        paymentId = `payme_${Date.now()}`;
      } else {
        paymentId = `payme_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }
    }

    // Update order with payment info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        amount: amount,
        commission_amount: commission,
        master_amount: masterAmount,
        payment_method: 'online',
        status: 'accepted',
      })
      .eq('id', orderId);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update order' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log transactions
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await serviceClient.from('transactions').insert({
      user_id: userId,
      order_id: orderId,
      amount: amount,
      type: 'payment',
      description: `Online to'lov ${provider} orqali - Buyurtma ${orderId.slice(0, 8)}`,
    });

    await serviceClient.from('transactions').insert({
      user_id: userId,
      order_id: orderId,
      amount: -commission,
      type: 'commission',
      description: `Platforma komissiyasi (10%) - Buyurtma ${orderId.slice(0, 8)}`,
    });

    // Credit master if assigned
    if (order.master_id) {
      await serviceClient.from('transactions').insert({
        user_id: order.master_id,
        order_id: orderId,
        amount: masterAmount,
        type: 'earning',
        description: `Buyurtma daromadi ${orderId.slice(0, 8)} (10% komissiyadan keyin)`,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId,
      paymentUrl: paymentUrl || null,
      provider,
      amount,
      commission,
      masterAmount,
      message: paymentUrl ? `${provider} to'lov sahifasiga yo'naltiring` : `To'lov ${provider} orqali amalga oshirildi (demo rejim)`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
