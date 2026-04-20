-- Seed: Regions (idempotent)
INSERT INTO public.regions (id, island_id, name, description, "order") VALUES
  ('00000000-0000-0000-0000-000000000101', 'numeros', 'Puerto del 1', 'El primer puerto donde todo comienza. Contar y reconocer números.', 1),
  ('00000000-0000-0000-0000-000000000102', 'numeros', 'Valle de las Sumas', 'Donde los números se juntan y crecen. Sumas y combinaciones.', 2),
  ('00000000-0000-0000-0000-000000000103', 'numeros', 'Bosque de las Restas', 'El bosque misterioso donde los números se separan. Restas y diferencias.', 3),
  ('00000000-0000-0000-0000-000000000104', 'numeros', 'Montaña del 100', 'La gran montaña donde los números se multiplican. Multiplicación y patrones.', 4),
  ('00000000-0000-0000-0000-000000000201', 'amigos', 'Playa de las Emociones', 'La playa donde descubrís qué sentís y cómo expresarlo.', 1),
  ('00000000-0000-0000-0000-000000000202', 'amigos', 'Selva de la Amistad', 'La selva donde aprendés a ser un buen amigo y resolver conflictos.', 2)
ON CONFLICT DO NOTHING;