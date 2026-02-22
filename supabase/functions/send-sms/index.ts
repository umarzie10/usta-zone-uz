import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsRequest {
  phone: string;
  message: string;
  type: 'new_order' | 'new_message' | 'order_update';
}

// Get Eskiz.uz auth token
async function getEskizToken(): Promise<string> {
  const email = Deno.env.get('ESKIZ_EMAIL');
  const password = Deno.env.get('ESKIZ_PASSWORD');

  if (!email || !password) {
    throw new Error('Eskiz credentials not configured');
  }

  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);

  const resp = await fetch('https://notify.eskiz.uz/api/auth/login', {
    method: 'POST',
    body: formData,
  });

  const data = await resp.json();
  if (!resp.ok || !data?.data?.token) {
    throw new Error(`Eskiz auth failed: ${JSON.stringify(data)}`);
  }

  return data.data.token;
}

// Send SMS via Eskiz.uz
async function sendSms(token: string, phone: string, message: string): Promise<boolean> {
  // Clean phone number - remove + and spaces
  const cleanPhone = phone.replace(/[\s+\-()]/g, '');

  const formData = new FormData();
  formData.append('mobile_phone', cleanPhone);
  formData.append('message', message);
  formData.append('from', '4546');
  formData.append('callback_url', '');

  const resp = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await resp.json();
  console.log('Eskiz SMS response:', JSON.stringify(data));
  return resp.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, type } = await req.json() as SmsRequest;

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = await getEskizToken();
    const success = await sendSms(token, phone, message);

    return new Response(
      JSON.stringify({ success, type }),
      { status: success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SMS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
