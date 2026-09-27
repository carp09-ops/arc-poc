// Single shared Supabase client for every Arc module.
//
// Previously each of the 12 feature modules created its own client with
// slightly different auth options, duplicating session detection/refresh work
// and inviting races. Import { supabase } from here instead.
//
// The ESM bundle is loaded from a primary CDN with two fallbacks, so a single
// CDN outage can no longer take the whole app (including the auth gate) down.
const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';

const CDN_SOURCES = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm',
  'https://esm.sh/@supabase/supabase-js@2.116.0',
  'https://cdn.skypack.dev/@supabase/supabase-js@2.116.0'
];

let createClient = null;
for (const src of CDN_SOURCES) {
  try {
    const mod = await import(src);
    if (mod?.createClient) { createClient = mod.createClient; break; }
  } catch (_) { /* try the next CDN */ }
}

if (!createClient) {
  throw new Error('Arc could not load its data library. Check your connection and reload.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
