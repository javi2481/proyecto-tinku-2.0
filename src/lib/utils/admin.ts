import 'server-only';

/**
 * Lista de emails con acceso admin (revisión pedagógica, ops internas).
 * Se configura en .env.local como ADMIN_EMAILS=email1,email2
 *
 * Fallback: si no hay env var, permitimos al test user de Ola 1 para no bloquear dev.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? 'tinku-test-1776447878@example.com';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
