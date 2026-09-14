import { createClient } from 'npm:@supabase/supabase-js@2.116.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== 'DELETE') return json({ error: 'Deletion confirmation required' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}');
    const publishableKey = publishableKeys.default || Deno.env.get('SUPABASE_ANON_KEY') || '';

    const userClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.slice('Bearer '.length);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: 'Authentication required' }, 401);

    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    const adminKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!adminKey) return json({ error: 'Account deletion is temporarily unavailable.' }, 503);

    const admin = createClient(supabaseUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // profiles.user_id references auth.users ON DELETE CASCADE, and every Arc
    // user-owned public table cascades from profiles. Deleting the auth user is
    // therefore the single authoritative deletion operation.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id, false);
    if (deleteError) {
      console.error('delete-account failed', deleteError.message);
      return json({ error: 'Arc could not delete the account. Please try again.' }, 500);
    }

    return json({ ok: true });
  } catch (error) {
    console.error('delete-account unexpected error', error);
    return json({ error: 'Arc could not delete the account. Please try again.' }, 500);
  }
});
