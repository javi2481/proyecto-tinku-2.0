-- Seed: Islands (idempotent via ON CONFLICT)
INSERT INTO public.islands (id, name, description, theme_color, nap_alignment) VALUES
  ('numeros', 'Isla de los Números', 'La isla donde los números cobran vida. Aprende a contar, sumar, restar y dominar el mundo de las matemáticas.', '#3B82F6', 'Matemática'),
  ('amigos', 'Isla de los Amigos', 'Una isla llena de aventuras socioemocionales. Aprendé a conocer tus emociones y a relacionarte con otros.', '#10B981', 'Formación Ética y Ciudadana')
ON CONFLICT (id) DO NOTHING;