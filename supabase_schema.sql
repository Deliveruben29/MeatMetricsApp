-- SQL Script for MeatMetrics (Supabase/PostgreSQL)

-- Table for Incidents (Averías)
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift VARCHAR(50) NOT NULL, -- Turno (e.g., Mañana, Tarde, Noche)
    section VARCHAR(100) NOT NULL,
    sub_section VARCHAR(100) NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    status VARCHAR(20) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Resuelto')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Production Logs (Producción)
CREATE TABLE production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_rate INTEGER NOT NULL, -- ej. 4800, 3600
    hour_block VARCHAR(50) NOT NULL, -- ej. 08:00-09:00
    actual_production INTEGER NOT NULL,
    difference INTEGER GENERATED ALWAYS AS (actual_production - target_rate) STORED,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies (to be refined based on auth)
CREATE POLICY "Allow authenticated read access" ON incidents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON production_logs FOR SELECT USING (auth.role() = 'authenticated');
