-- ============================================================
-- Migration 002: Catalog Tables
-- Tables: islands, regions, concepts, concept_prerequisites, exercises
-- Includes: ENUM types, seed data
-- ============================================================

-- -----------------------------------------------------------
-- ENUM: island_id
-- -----------------------------------------------------------
CREATE TYPE public.island_id AS ENUM ('numeros', 'amigos');

-- -----------------------------------------------------------
-- ENUM: concept_mastery_status
-- -----------------------------------------------------------
CREATE TYPE public.concept_mastery_status AS ENUM (
  'not_started', 'in_progress', 'mastered', 'needs_review'
);

-- -----------------------------------------------------------
-- ENUM: exercise_type
-- -----------------------------------------------------------
CREATE TYPE public.exercise_type AS ENUM (
  'mcq', 'numeric_input', 'h5p_fill_blank', 'h5p_drag_drop',
  'h5p_match', 'socioemotional_dilemma'
);

-- -----------------------------------------------------------
-- ENUM: mission_type
-- -----------------------------------------------------------
CREATE TYPE public.mission_type AS ENUM (
  'daily', 'weekly', 'exploratory', 'creative'
);

-- -----------------------------------------------------------
-- ENUM: mission_status
-- -----------------------------------------------------------
CREATE TYPE public.mission_status AS ENUM (
  'active', 'completed', 'expired'
);

-- -----------------------------------------------------------
-- Table: islands
-- -----------------------------------------------------------
CREATE TABLE public.islands (
  id            public.island_id PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  theme_color   TEXT,
  nap_alignment TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Table: regions
-- -----------------------------------------------------------
CREATE TABLE public.regions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  island_id   public.island_id NOT NULL REFERENCES public.islands(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  "order"     SMALLINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_regions_island ON public.regions(island_id);

-- -----------------------------------------------------------
-- Table: concepts
-- -----------------------------------------------------------
CREATE TABLE public.concepts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id        UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  difficulty_range SMALLINT[] NOT NULL,
  province_coin    TEXT NOT NULL,
  nap_alignment    TEXT,
  type_distribution JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_concepts_region ON public.concepts(region_id);

-- -----------------------------------------------------------
-- Table: concept_prerequisites
-- -----------------------------------------------------------
CREATE TABLE public.concept_prerequisites (
  concept_id      UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  prerequisite_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  PRIMARY KEY (concept_id, prerequisite_id)
);

-- -----------------------------------------------------------
-- Table: exercises
-- -----------------------------------------------------------
CREATE TABLE public.exercises (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id     UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  exercise_type  public.exercise_type NOT NULL,
  prompt         TEXT NOT NULL,
  correct_answer JSONB NOT NULL,
  distractors    JSONB,
  hint           TEXT,
  character_id  TEXT,
  context_id    TEXT,
  difficulty     SMALLINT,
  source         TEXT NOT NULL DEFAULT 'generated_v1',
  approved       BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_concept ON public.exercises(concept_id, exercise_type);

-- Trigger: updated_at for exercises
CREATE TRIGGER trg_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------
-- RLS: Catalog tables are readable by everyone
-- -----------------------------------------------------------
ALTER TABLE public.islands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Islands: anyone can read
CREATE POLICY "Islands are publicly readable"
  ON public.islands FOR SELECT
  TO anon, authenticated
  USING (true);

-- Regions: anyone can read
CREATE POLICY "Regions are publicly readable"
  ON public.regions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Concepts: anyone can read
CREATE POLICY "Concepts are publicly readable"
  ON public.concepts FOR SELECT
  TO anon, authenticated
  USING (true);

-- Concept prerequisites: anyone can read
CREATE POLICY "Concept prerequisites are publicly readable"
  ON public.concept_prerequisites FOR SELECT
  TO anon, authenticated
  USING (true);

-- Exercises: anyone can read approved exercises, admins can do all
CREATE POLICY "Approved exercises are publicly readable"
  ON public.exercises FOR SELECT
  TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Admins can manage exercises"
  ON public.exercises FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------
-- Seeds: Islands (idempotent via ON CONFLICT)
-- -----------------------------------------------------------
INSERT INTO public.islands (id, name, description, theme_color, nap_alignment) VALUES
  ('numeros', 'Isla de los Números', 'La isla donde los números cobran vida. Aprende a contar, sumar, restar y dominar el mundo de las matemáticas.', '#3B82F6', 'Matemática'),
  ('amigos', 'Isla de los Amigos', 'Una isla llena de aventuras socioemocionales. Aprendé a conocer tus emociones y a relacionarte con otros.', '#10B981', 'Formación Ética y Ciudadana')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- Seeds: Regions (idempotent)
-- -----------------------------------------------------------
INSERT INTO public.regions (id, island_id, name, description, "order") VALUES
  ('00000000-0000-0000-0000-000000000101', 'numeros', 'Puerto del 1', 'El primer puerto donde todo comienza. Contar y reconocer números.', 1),
  ('00000000-0000-0000-0000-000000000102', 'numeros', 'Valle de las Sumas', 'Donde los números se juntan y crecen. Sumas y combinaciones.', 2),
  ('00000000-0000-0000-0000-000000000103', 'numeros', 'Bosque de las Restas', 'El bosque misterioso donde los números se separan. Restas y diferencias.', 3),
  ('00000000-0000-0000-0000-000000000104', 'numeros', 'Montaña del 100', 'La gran montaña donde los números se multiplican. Multiplicación y patrones.', 4),
  ('00000000-0000-0000-0000-000000000201', 'amigos', 'Playa de las Emociones', 'La playa donde descubrís qué sentís y cómo expresarlo.', 1),
  ('00000000-0000-0000-0000-000000000202', 'amigos', 'Selva de la Amistad', 'La selva donde aprendés a ser un buen amigo y resolver conflictos.', 2)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- Seeds: Concepts (idempotent)
-- -----------------------------------------------------------
INSERT INTO public.concepts (id, region_id, name, description, difficulty_range, province_coin, nap_alignment, type_distribution) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Reconocer números del 1 al 10', 'Identificar y nombrar números del 1 al 10 en diferentes contextos.', '{1,1}', 'moneda-puerto', 'NAP Matemática 1°', '{"mcq":0.5,"numeric_input":0.3,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', 'Contar hasta 20', 'Contar objetos y reconocer la secuencia numérica hasta 20.', '{1,2}', 'moneda-puerto', 'NAP Matemática 1°', '{"mcq":0.4,"numeric_input":0.4,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101', 'Comparar cantidades', 'Comparar grupos de objetos usando más, menos, igual.', '{1,1}', 'moneda-puerto', 'NAP Matemática 1°', '{"mcq":0.6,"numeric_input":0.2,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000101', 'Escribir números del 1 al 10', 'Escribir correctamente los números del 1 al 10.', '{1,1}', 'moneda-puerto', 'NAP Matemática 1°', '{"numeric_input":0.5,"h5p_fill_blank":0.3,"mcq":0.2}'),
  ('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000102', 'Sumar con números del 1 al 5', 'Resolver sumas simples con números del 1 al 5 usando objetos.', '{1,2}', 'moneda-valle', 'NAP Matemática 1°', '{"mcq":0.4,"numeric_input":0.4,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000102', 'Sumar con números hasta 10', 'Resolver sumas con resultados hasta 10.', '{1,2}', 'moneda-valle', 'NAP Matemática 1°', '{"numeric_input":0.5,"mcq":0.3,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000102', 'Problemas de suma con objetos', 'Resolver problemas verbales de suma usando representaciones.', '{2,3}', 'moneda-valle', 'NAP Matemática 1°-2°', '{"mcq":0.5,"numeric_input":0.3,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000102', 'Dobles y mitades', 'Reconocer dobles (2+2, 3+3) y mitades como estrategia de cálculo.', '{2,3}', 'moneda-valle', 'NAP Matemática 2°', '{"mcq":0.6,"numeric_input":0.3,"h5p_match":0.1}'),
  ('c0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000103', 'Restar con números hasta 5', 'Resolver restas simples con números hasta 5.', '{1,2}', 'moneda-bosque', 'NAP Matemática 1°', '{"mcq":0.4,"numeric_input":0.4,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000103', 'Restar con números hasta 10', 'Resolver restas con minuendo hasta 10.', '{1,2}', 'moneda-bosque', 'NAP Matemática 1°-2°', '{"numeric_input":0.5,"mcq":0.3,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000103', 'Suma y resta inversas', 'Entender la relación entre suma y resta (3+4=7, 7-4=3).', '{2,3}', 'moneda-bosque', 'NAP Matemática 2°', '{"mcq":0.4,"numeric_input":0.4,"h5p_match":0.2}'),
  ('c0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000103', 'Problemas de resta', 'Resolver problemas verbales que requieren restar.', '{2,3}', 'moneda-bosque', 'NAP Matemática 2°', '{"mcq":0.5,"numeric_input":0.3,"h5p_fill_blank":0.2}'),
  ('c0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000104', 'Contar hasta 100', 'Contar de 5 en 5 y de 10 en 10 hasta 100.', '{2,3}', 'moneda-montaña', 'NAP Matemática 2°-3°', '{"numeric_input":0.4,"mcq":0.4,"h5p_fill_blank":0.2}'),
  ('c0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000104', 'Decenas y unidades', 'Descomponer números en decenas y unidades (34 = 30+4).', '{2,3}', 'moneda-montaña', 'NAP Matemática 2°', '{"mcq":0.5,"numeric_input":0.3,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000104', 'Multiplicación como suma repetida', 'Entender 3x4 como 4+4+4 y resolver multiplicaciones simples.', '{3,4}', 'moneda-montaña', 'NAP Matemática 3°', '{"numeric_input":0.5,"mcq":0.3,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000104', 'Tablas del 2, 5 y 10', 'Memorizar y aplicar las tablas de multiplicar del 2, 5 y 10.', '{3,4}', 'moneda-montaña', 'NAP Matemática 3°', '{"mcq":0.4,"numeric_input":0.4,"h5p_match":0.2}'),
  ('c0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000104', 'Patrones numéricos', 'Identificar y continuar patrones numéricos (2, 4, 6, 8...).', '{3,4}', 'moneda-montaña', 'NAP Matemática 3°-4°', '{"mcq":0.4,"numeric_input":0.4,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000104', 'Fracciones simples', 'Identificar mitades, tercios y cuartos con representaciones visuales.', '{4,5}', 'moneda-montaña', 'NAP Matemática 4°-5°', '{"mcq":0.4,"h5p_drag_drop":0.3,"h5p_fill_blank":0.3}'),
  ('c0000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000104', 'Sumar y restar hasta 100', 'Realizar cálculos con resultados hasta 100, incluyendo lleva.', '{3,4}', 'moneda-montaña', 'NAP Matemática 3°', '{"numeric_input":0.5,"mcq":0.3,"h5p_fill_blank":0.2}'),
  ('c0000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000104', 'Resolver problemas de dos pasos', 'Resolver problemas que requieren dos operaciones (suma+resta).', '{4,5}', 'moneda-montaña', 'NAP Matemática 4°-5°', '{"numeric_input":0.4,"mcq":0.4,"h5p_fill_blank":0.2}'),
  ('c0000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000104', 'Geometría básica: formas', 'Reconocer y clasificar formas geométricas (círculo, cuadrado, triángulo).', '{1,2}', 'moneda-montaña', 'NAP Matemática 1°-2°', '{"mcq":0.5,"h5p_drag_drop":0.3,"h5p_match":0.2}'),
  ('c0000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000104', 'Medidas: longitud y peso', 'Comparar y medir objetos usando unidades no convencionales.', '{2,3}', 'moneda-montaña', 'NAP Matemática 2°-3°', '{"mcq":0.5,"numeric_input":0.3,"h5p_drag_drop":0.2}'),
  ('c0000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000201', 'Reconocer emociones propias', 'Identificar y nombrar las propias emociones en situaciones cotidianas.', '{1,2}', 'moneda-playa', 'NAP Formación Ética 1°-2°', '{"socioemotional_dilemma":0.6,"mcq":0.3,"h5p_drag_drop":0.1}'),
  ('c0000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'Expresar lo que sentimos', 'Practicar formas saludables de expresar emociones (palabras, dibujos).', '{1,2}', 'moneda-playa', 'NAP Formación Ética 1°-2°', '{"socioemotional_dilemma":0.5,"mcq":0.3,"h5p_fill_blank":0.2}'),
  ('c0000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000201', 'Autoconocimiento y fortalezas', 'Descubrir qué cosas hago bien y qué me gusta de mí.', '{2,3}', 'moneda-playa', 'NAP Formación Ética 2°', '{"socioemotional_dilemma":0.5,"mcq":0.3,"h5p_match":0.2}'),
  ('c0000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000202', 'Escuchar y comprender al otro', 'Practicar la escucha activa y la empatía con los demás.', '{2,3}', 'moneda-selva', 'NAP Formación Ética 2°-3°', '{"socioemotional_dilemma":0.6,"mcq":0.3,"h5p_drag_drop":0.1}'),
  ('c0000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000202', 'Resolver conflictos pacíficamente', 'Aprender estrategias para resolver desacuerdos sin agresión.', '{3,4}', 'moneda-selva', 'NAP Formación Ética 3°-4°', '{"socioemotional_dilemma":0.6,"mcq":0.2,"h5p_match":0.2}')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- Seeds: Concept prerequisites (idempotent)
-- -----------------------------------------------------------
INSERT INTO public.concept_prerequisites (concept_id, prerequisite_id) VALUES
  ('c0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000010'),
  ('c0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000011'),
  ('c0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000021'),
  ('c0000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000011'),
  ('c0000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000030'),
  ('c0000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000031'),
  ('c0000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000032'),
  ('c0000000-0000-0000-0000-000000000101', 'c0000000-0000-0000-0000-000000000100'),
  ('c0000000-0000-0000-0000-000000000102', 'c0000000-0000-0000-0000-000000000100'),
  ('c0000000-0000-0000-0000-000000000110', 'c0000000-0000-0000-0000-000000000102'),
  ('c0000000-0000-0000-0000-000000000111', 'c0000000-0000-0000-0000-000000000110')
ON CONFLICT DO NOTHING;