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

    // MOCK: Simulate payment processing
    // In production, replace with actual Click/Payme API calls:
    // Click: POST https://api.click.uz/v2/merchant/...
    // Payme: POST https://checkout.paycom.uz/api/...
    const mockPaymentId = `${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

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

    // Log transaction
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await serviceClient.from('transactions').insert({
      user_id: userId,
      order_id: orderId,
      amount: amount,
      type: 'payment',
      description: `Online payment via ${provider} - Order ${orderId.slice(0, 8)}`,
    });

    // Log commission
    await serviceClient.from('transactions').insert({
      user_id: userId,
      order_id: orderId,
      amount: -commission,
      type: 'commission',
      description: `Platform commission (10%) - Order ${orderId.slice(0, 8)}`,
    });

    // If master is assigned, credit master balance
    if (order.master_id) {
      await serviceClient.from('transactions').insert({
        user_id: order.master_id,
        order_id: orderId,
        amount: masterAmount,
        type: 'earning',
        description: `Earning from order ${orderId.slice(0, 8)} (after 10% commission)`,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId: mockPaymentId,
      provider,
      amount,
      commission,
      masterAmount,
      message: `Payment processed via ${provider} (demo mode)`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
