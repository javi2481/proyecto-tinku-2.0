import { z } from 'zod';

/**
 * 6 caracteres del alfabeto sin ambigüedad (sin 0/O, 1/I/L).
 * Matchea con generate_login_code en Postgres.
 */
export const loginCodeSchema = z.object({
  login_code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-KM-NP-Z2-9]{6}$/, 'El código tiene 6 letras y números.')
    // Postgres usa ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (excluye I, O).
    // Zod acepta L e I por simplicidad aquí — Postgres chk_check rechaza si no matchea.
    ,
});
export type LoginCodeInput = z.infer<typeof loginCodeSchema>;
