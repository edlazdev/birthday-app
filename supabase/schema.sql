-- ========================================================
-- PROYECTO FREELOADER - ESQUEMA SUPABASE MULTITENANT
-- ========================================================

-- 1. Tabla de Tenants / Eventos
CREATE TABLE IF NOT EXISTS public.event_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'birthday', -- 'birthday', 'wedding', 'other'
    status VARCHAR(20) NOT NULL DEFAULT 'published', -- 'published', 'draft', 'archived'
    
    -- Información del Festejado / Pareja
    celebrant VARCHAR(150) NOT NULL,
    before_celebrant VARCHAR(150),
    title VARCHAR(255) NOT NULL DEFAULT 'Cumple',
    age VARCHAR(50),
    after_age VARCHAR(50),
    tagline TEXT,
    og_site_name VARCHAR(150),

    -- Fecha, Hora y Ubicación
    event_date VARCHAR(100) NOT NULL,
    event_time VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    map_lat NUMERIC(12, 8),
    map_lng NUMERIC(12, 8),

    -- Comunicación & RSVP
    whatsapp VARCHAR(50) NOT NULL,
    whatsapp_name VARCHAR(100),
    msg_redirect_album VARCHAR(150) DEFAULT 'Mira cuánto hemos crecido',
    msg_tooltip VARCHAR(150) DEFAULT 'Confirmar asistencia',

    -- Control Granular de Visibilidad (Feature Flags)
    features JSONB NOT NULL DEFAULT '{
        "show_album": true,
        "show_avatar": true,
        "show_video_background": false,
        "show_map": true,
        "show_rsvp": true,
        "show_gifts": true,
        "show_sponsors": true,
        "show_witnesses": true,
        "show_social_links": true
    }'::jsonb,

    -- Estilos y Tema
    theme JSONB NOT NULL DEFAULT '{
        "primary": "#ff9800",
        "secondary": "#2196f3",
        "tertiary": "#4caf50",
        "bg": "#ffffff"
    }'::jsonb,

    fonts JSONB NOT NULL DEFAULT '{
        "title": { "type": "google", "family": "Poppins", "weights": ["600"] },
        "text": { "type": "google", "family": "Poppins", "weights": ["400"] }
    }'::jsonb,

    -- Medios
    media JSONB NOT NULL DEFAULT '{
        "cover_url": "",
        "avatar_url": "",
        "album_urls": [],
        "album_count": 0,
        "background_video": null
    }'::jsonb,

    -- Extras dinámicos
    gift_recommendations JSONB DEFAULT '[]'::jsonb,
    recommendations_title VARCHAR(150),
    recommendations_description TEXT,
    sponsors JSONB DEFAULT '{"groom": [], "bride": []}'::jsonb,
    witnesses JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '{"facebook": true, "instagram": true}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_event_tenants_updated_at ON public.event_tenants;
CREATE TRIGGER trigger_event_tenants_updated_at
BEFORE UPDATE ON public.event_tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 2. Tabla de Confirmaciones RSVP
CREATE TABLE IF NOT EXISTS public.rsvp_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.event_tenants(id) ON DELETE CASCADE,
    tenant_slug VARCHAR(100),
    guest_name VARCHAR(150) NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    boys INTEGER NOT NULL DEFAULT 0,
    girls INTEGER NOT NULL DEFAULT 0,
    phone VARCHAR(50),
    notes TEXT,
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.event_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_confirmations ENABLE ROW LEVEL SECURITY;

-- Políticas para event_tenants:
-- Invitados pueden consultar eventos publicados (y los autenticados ven todos)
DROP POLICY IF EXISTS "Public can view published events" ON public.event_tenants;
CREATE POLICY "Public can view published events"
ON public.event_tenants FOR SELECT
USING (status = 'published' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access to event_tenants" ON public.event_tenants;
CREATE POLICY "Authenticated users full access to event_tenants"
ON public.event_tenants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para rsvp_confirmations:
-- Invitados pueden registrar su asistencia
DROP POLICY IF EXISTS "Public can insert rsvp" ON public.rsvp_confirmations;
CREATE POLICY "Public can insert rsvp"
ON public.rsvp_confirmations FOR INSERT
WITH CHECK (true);

-- Administradores autenticados pueden ver y gestionar confirmaciones
DROP POLICY IF EXISTS "Authenticated users full access to rsvp_confirmations" ON public.rsvp_confirmations;
CREATE POLICY "Authenticated users full access to rsvp_confirmations"
ON public.rsvp_confirmations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Storage Bucket para Medios (Fotos, Portadas, Avatares, Álbumes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('freeloader-media', 'freeloader-media', true)
ON CONFLICT (id) DO NOTHING;

-- Política pública para ver archivos del bucket freeloader-media
DROP POLICY IF EXISTS "Public view for freeloader-media" ON storage.objects;
CREATE POLICY "Public view for freeloader-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'freeloader-media');

-- Política para que usuarios autenticados puedan subir archivos
DROP POLICY IF EXISTS "Authenticated upload to freeloader-media" ON storage.objects;
CREATE POLICY "Authenticated upload to freeloader-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'freeloader-media');

DROP POLICY IF EXISTS "Authenticated update/delete in freeloader-media" ON storage.objects;
CREATE POLICY "Authenticated update/delete in freeloader-media"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'freeloader-media');

-- 5. Seed Inicial con los 3 eventos existentes
INSERT INTO public.event_tenants (
    slug, type, status, celebrant, before_celebrant, title, age, after_age, tagline,
    event_date, event_time, address, map_lat, map_lng, whatsapp, whatsapp_name,
    msg_redirect_album, msg_tooltip, features, theme, fonts, media,
    gift_recommendations, recommendations_title, recommendations_description,
    sponsors, witnesses, social_links
) VALUES
(
    'chamaquitos',
    'birthday',
    'published',
    'Chamaquitos',
    'Nuestros',
    'Cumplen',
    '1',
    'añito',
    '¡Acompáñanos a celebrar este lindo momento!',
    'Sábado 07 de Febrero',
    '4:30 PM',
    'Mz F Lt 37 Urb. Rosas del Valle, Trujillo',
    -8.0881487,
    -79.0530356,
    '51966761177',
    NULL,
    'Mira cuánto hemos crecido',
    'Asegura tu comida 😜',
    '{
        "show_album": true,
        "show_avatar": true,
        "show_video_background": true,
        "show_map": true,
        "show_rsvp": true,
        "show_gifts": false,
        "show_sponsors": false,
        "show_witnesses": false,
        "show_social_links": true
    }'::jsonb,
    '{
        "primary": "#FBBD0B",
        "secondary": "#26B5BA",
        "tertiary": "#EA5C4A",
        "bg": "#fff8ee"
    }'::jsonb,
    '{
        "title": { "type": "local", "family": "QuirkySpring", "src": "/fonts/QuirkySpring.ttf" },
        "text": { "type": "google", "family": "Poppins", "weights": ["400", "600", "700"] }
    }'::jsonb,
    '{
        "cover_url": "",
        "avatar_url": "",
        "album_urls": [],
        "album_count": 12,
        "background_video": {
            "invitation": { "youtubeId": "7QAe_RFewEQ", "muted": true, "loop": true, "start": 2 },
            "album": { "youtubeId": "QN5RobQ6L04", "muted": true, "loop": true, "start": 8 }
        }
    }'::jsonb,
    '[]'::jsonb,
    NULL,
    NULL,
    '{"groom": [], "bride": []}'::jsonb,
    '[]'::jsonb,
    '{"facebook": true, "instagram": true}'::jsonb
),
(
    'emmanuel',
    'birthday',
    'published',
    'Emmanuel',
    'Soy',
    'Cumplo',
    '2',
    'añitos',
    '¡Acompáñame a celebrar mi cumpleaños!',
    'Jueves 19 de Febrero',
    '5:00 PM',
    'Manuel Arevalo III Etapa, Mz  A38 Lt 30',
    -8.0699676,
    -79.0701625,
    '51902767559',
    'Ronal',
    'Mira cuánto hemos crecido',
    'Asegura tu comida 😜',
    '{
        "show_album": false,
        "show_avatar": true,
        "show_video_background": false,
        "show_map": true,
        "show_rsvp": true,
        "show_gifts": true,
        "show_sponsors": false,
        "show_witnesses": false,
        "show_social_links": true
    }'::jsonb,
    '{
        "primary": "#F7710A",
        "secondary": "#36BA2C",
        "tertiary": "#EA5C4A",
        "bg": "#eef2ff"
    }'::jsonb,
    '{
        "title": { "type": "local", "family": "QuirkySpring", "src": "/fonts/QuirkySpring.ttf" },
        "text": { "type": "google", "family": "Poppins", "weights": ["400", "600", "700"] }
    }'::jsonb,
    '{
        "cover_url": "",
        "avatar_url": "",
        "album_urls": [],
        "album_count": 12,
        "background_video": {
            "invitation": { "youtubeId": "4XJ5XaTalIw", "muted": true, "loop": true, "start": 12 },
            "album": { "youtubeId": "QN5RobQ6L04", "muted": true, "loop": true, "start": 8 }
        }
    }'::jsonb,
    '["Mesa de regalos", "Libros didácticos", "Libros de cuentos", "Libros para colorear"]'::jsonb,
    NULL,
    NULL,
    '{"groom": [], "bride": []}'::jsonb,
    '[]'::jsonb,
    '{"facebook": true, "instagram": true}'::jsonb
),
(
    'ronalymaria',
    'wedding',
    'published',
    'Ronal y María',
    'Nuestra boda',
    'CON MUCHA ALEGRÍA LOS INVITAMOS A CELEBRAR EL DÍA MÁS ESPECIAL DE NUESTRAS VIDAS',
    '',
    '',
    '',
    'Sábado 2 de Mayo',
    '3:00 PM',
    'Fundo las palmeras, Huanchaco',
    -8.087766977814466,
    -79.07890072378052,
    '51902767559',
    'Ronal',
    'Mira cuánto hemos crecido',
    'Asegura tu comida 😜',
    '{
        "show_album": false,
        "show_avatar": false,
        "show_video_background": false,
        "show_map": true,
        "show_rsvp": true,
        "show_gifts": true,
        "show_sponsors": true,
        "show_witnesses": true,
        "show_social_links": true
    }'::jsonb,
    '{
        "primary": "#8A9A5B",
        "secondary": "#333333",
        "tertiary": "#D4AF37",
        "bg": "#F5F5F0"
    }'::jsonb,
    '{
        "title": { "type": "google", "family": "Pinyon Script", "weights": ["400"] },
        "text": { "type": "google", "family": "Montserrat", "weights": ["100", "200", "300", "400", "500", "600", "700", "800", "900"] }
    }'::jsonb,
    '{
        "cover_url": "",
        "avatar_url": "",
        "album_urls": [],
        "album_count": 12,
        "background_video": {
            "invitation": { "youtubeId": "4XJ5XaTalIw", "muted": true, "loop": true, "start": 12 },
            "album": { "youtubeId": "QN5RobQ6L04", "muted": true, "loop": true, "start": 8 }
        }
    }'::jsonb,
    '["✈ Viajes", "🍽 Cenas", "🔌 Electrodomésticos", "💰 Efectivo", "🏦 Transferencia BCP: 57070984724094", "🏦 Transferencia Interbancaria: 00257017098472409407"]'::jsonb,
    'Sugerencias de regalo',
    'El mejor regalo es que estés presente en este día, pero si deseas hacernos un obsequio pueden dejarlo en: 📍 Manuel Arévalo 3era etapa Mz A 38 lote 30 Botica Malena (Frente al colegio Divino Jesús), tambien te dejamos algunas sugerencias.',
    '{
        "groom": ["Carlos A. Ramos Bazán", "Lucy M. Sánchez Pavón "],
        "bride": ["Yeiner E. Vasquez Valle", "Esther Arenas Limas"]
    }'::jsonb,
    '["Jose L. Plasencia Carrera", "Enrique Aguilar Vasquez"]'::jsonb,
    '{"facebook": true, "instagram": true}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    type = EXCLUDED.type,
    status = EXCLUDED.status,
    celebrant = EXCLUDED.celebrant,
    before_celebrant = EXCLUDED.before_celebrant,
    title = EXCLUDED.title,
    age = EXCLUDED.age,
    after_age = EXCLUDED.after_age,
    tagline = EXCLUDED.tagline,
    event_date = EXCLUDED.event_date,
    event_time = EXCLUDED.event_time,
    address = EXCLUDED.address,
    map_lat = EXCLUDED.map_lat,
    map_lng = EXCLUDED.map_lng,
    whatsapp = EXCLUDED.whatsapp,
    whatsapp_name = EXCLUDED.whatsapp_name,
    features = EXCLUDED.features,
    theme = EXCLUDED.theme,
    fonts = EXCLUDED.fonts,
    media = EXCLUDED.media,
    gift_recommendations = EXCLUDED.gift_recommendations,
    recommendations_title = EXCLUDED.recommendations_title,
    recommendations_description = EXCLUDED.recommendations_description,
    sponsors = EXCLUDED.sponsors,
    witnesses = EXCLUDED.witnesses,
    social_links = EXCLUDED.social_links;
