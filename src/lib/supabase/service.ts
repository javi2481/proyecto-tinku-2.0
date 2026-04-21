import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client con service_role. BYPASSEA RLS.
 *
 * USAR SOLO EN:
 *   - Alta de student + escritura a parental_consents (event log)
 *   - Regeneración de login_code (cron / admin)
 *   - Webhook handlers (Resend, pagos)
 *   - Write a data_access_log
 *   - Write a app_logs
 *
 * NUNCA importar desde Client Components.
 * Cada uso debe llevar comentario justificando el bypass de RLS.
 */
let cached: ReturnType<typeof createClient> | null = null;

export function createServiceSupabase() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials');
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
