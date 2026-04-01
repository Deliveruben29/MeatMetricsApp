-- ============================================================
-- MeatMetrics — Schema SQL v2.0
-- Ejecutar en: Supabase → SQL Editor → New Query
-- ============================================================

-- 1. Tabla de perfiles (roles de usuario)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin', 'management', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger: crea perfil automáticamente al registrarse un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Tabla principal de incidencias
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  turno TEXT NOT NULL CHECK (turno IN ('TM', 'TT', 'TN')),
  seccion TEXT NOT NULL DEFAULT 'General',
  subseccion TEXT,
  tipo_incidencia TEXT NOT NULL DEFAULT 'Otros'
    CHECK (tipo_incidencia IN ('Mecánica', 'Eléctrica', 'Pausa', 'Otros')),
  descripcion_averia TEXT,
  inicio_paro TIME,
  fin_paro TIME,
  total_minutos INTEGER NOT NULL DEFAULT 0,
  rendimiento_pct NUMERIC(6,2),
  estatus TEXT NOT NULL DEFAULT '⚠️ Pendiente'
    CHECK (estatus IN ('✅ Resuelto', '⚠️ Pendiente', '🔴 Crítico')),
  origen_archivo TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para queries del Dashboard
CREATE INDEX IF NOT EXISTS idx_incidents_fecha ON incidents(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_turno ON incidents(turno);
CREATE INDEX IF NOT EXISTS idx_incidents_estatus ON incidents(estatus);

-- ============================================================
-- 3. Row Level Security (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario ve su propio perfil
DROP POLICY IF EXISTS "own_profile_read" ON profiles;
CREATE POLICY "own_profile_read" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Profiles: admin ve todos los perfiles
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Incidents: todos los autenticados pueden LEER
DROP POLICY IF EXISTS "authenticated_read_incidents" ON incidents;
CREATE POLICY "authenticated_read_incidents" ON incidents
  FOR SELECT USING (auth.role() = 'authenticated');

-- Incidents: solo admin y management pueden ESCRIBIR
DROP POLICY IF EXISTS "write_incidents" ON incidents;
CREATE POLICY "write_incidents" ON incidents
  FOR INSERT WITH CHECK (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'management'))
  );

-- Incidents: admin y management pueden ACTUALIZAR
DROP POLICY IF EXISTS "update_incidents" ON incidents;
CREATE POLICY "update_incidents" ON incidents
  FOR UPDATE USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'management'))
  );

-- Incidents: solo admin puede BORRAR
DROP POLICY IF EXISTS "delete_incidents" ON incidents;
CREATE POLICY "delete_incidents" ON incidents
  FOR DELETE USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
