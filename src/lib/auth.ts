import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Mínimo 8 caracteres.')
  .regex(/[A-Za-z]/, 'Necesita al menos una letra.')
  .regex(/\d/, 'Necesita al menos un número.');

const email = z
  .string()
  .email('Ese email no parece válido.')
  .transform((v) => v.trim().toLowerCase());

export const signupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nombre muy corto.')
    .max(120, 'Nombre muy largo.'),
  email,
  password,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresá tu contraseña.'),
});
export type LoginInput = z.infer<typeof loginSchema>;
