const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const requestedBookingMode = (import.meta.env.VITE_BOOKING_MODE || 'demo').trim().toLowerCase();

export const bookingMode = requestedBookingMode === 'live' ? 'live' : 'demo';

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-public-key-here'
);

if (import.meta.env.DEV && requestedBookingMode !== 'demo' && requestedBookingMode !== 'live') {
  console.warn('⚠️ Невідомий VITE_BOOKING_MODE. Використовується безпечний демо-режим.');
}

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.info(
    `ℹ️ Supabase credentials not set yet. Booking mode: ${bookingMode}.\n` +
    'To connect your backend, create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

let client;

export async function getSupabase() {
  if (!isSupabaseConfigured) return null;

  const { createClient } = await import('@supabase/supabase-js');
  client ??= createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
