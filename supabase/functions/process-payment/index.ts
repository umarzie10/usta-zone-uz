import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user via getUser
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = user.id;
    const body = await req.json();
    const { orderId, provider, amount } = body;

    if (!orderId || !provider || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields: orderId, provider, amount' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!['click', 'payme', 'cash'].includes(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid provider. Must be "click", "payme", or "cash"' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    let paymentId = `${provider}_demo_${Date.now()}`;

    if (provider === 'click') {
      const clickMerchantId = Deno.env.get('CLICK_MERCHANT_ID');
      const clickServiceId = Deno.env.get('CLICK_SERVICE_ID');
      if (clickMerchantId && clickServiceId) {
        paymentUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${amount}&transaction_param=${orderId}`;
        paymentId = `click_${Date.now()}`;
      }
    } else if (provider === 'payme') {
      const paymeMerchantId = Deno.env.get('PAYME_MERCHANT_ID');
      if (paymeMerchantId) {
        const encodedParams = btoa(JSON.stringify({
          m: paymeMerchantId,
          ac: { order_id: orderId },
          a: amount * 100,
        }));
        paymentUrl = `https://checkout.paycom.uz/${encodedParams}`;
        paymentId = `payme_${Date.now()}`;
      }
    }

    // Update order with payment info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        amount,
        commission_amount: commission,
        master_amount: masterAmount,
        payment_method: provider === 'cash' ? 'cash' : 'online',
        status: 'accepted',
      })
      .eq('id', orderId);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update order' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log transactions with service role
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (serviceRoleKey) {
      const serviceClient = createClient(supabaseUrl, serviceRoleKey);

      await serviceClient.from('transactions').insert({
        user_id: userId,
        order_id: orderId,
        amount,
        type: 'payment',
        description: `To'lov ${provider} orqali - Buyurtma ${orderId.slice(0, 8)}`,
      });

      await serviceClient.from('transactions').insert({
        user_id: userId,
        order_id: orderId,
        amount: -commission,
        type: 'commission',
        description: `Platforma komissiyasi (10%) - Buyurtma ${orderId.slice(0, 8)}`,
      });

      if (order.master_id) {
        await serviceClient.from('transactions').insert({
          user_id: order.master_id,
          order_id: orderId,
          amount: masterAmount,
          type: 'earning',
          description: `Buyurtma daromadi ${orderId.slice(0, 8)} (10% komissiyadan keyin)`,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId,
      paymentUrl: paymentUrl || null,
      provider,
      amount,
      commission,
      masterAmount,
      message: paymentUrl ? `${provider} to'lov sahifasiga yo'naltiring` : `To'lov ${provider} orqali amalga oshirildi`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('process-payment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
