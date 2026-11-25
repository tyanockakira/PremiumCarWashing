CREATE TABLE public.car_classes (
    id text PRIMARY KEY,
    label text NOT NULL,
    multiplier numeric(3, 2) NOT NULL DEFAULT 1.00 CHECK (multiplier > 0 AND multiplier <> 'NaN'::numeric),
    example_models text,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    description text,
    base_price integer NOT NULL CHECK (base_price >= 0),
    duration_text text,
    features text[] NOT NULL DEFAULT '{}',
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.service_packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    tag text,
    base_price integer NOT NULL CHECK (base_price >= 0),
    time_text text,
    description text,
    items text[] NOT NULL DEFAULT '{}',
    is_featured boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0
);

REVOKE ALL ON TABLE public.car_classes, public.services, public.service_packages
    FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.car_classes, public.services, public.service_packages
    TO anon, authenticated, service_role;

ALTER TABLE public.car_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_active_classes ON public.car_classes
    FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY read_active_services ON public.services
    FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY read_active_packages ON public.service_packages
    FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL CHECK (char_length(full_name) <= 120 AND full_name ~ '[^[:space:]]'),
    phone text NOT NULL UNIQUE CHECK (phone ~ '^[+]380[3-9][0-9]{8}$'),
    email text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients (id),
    car_class_id text REFERENCES public.car_classes (id),
    make_model text NOT NULL CHECK (char_length(make_model) <= 160 AND make_model ~ '[^[:space:]]'),
    license_plate text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, id)
);

CREATE TABLE public.bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('booking', 'consultation')),
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    contact_phone text NOT NULL CHECK (contact_phone ~ '^[+]380[3-9][0-9]{8}$'),
    contact_name text CHECK (char_length(contact_name) <= 120 AND contact_name ~ '[^[:space:]]'),
    car_model text CHECK (char_length(car_model) <= 160),
    service_name text CHECK (char_length(service_name) <= 200 AND service_name ~ '[^[:space:]]'),
    booking_date date CHECK (booking_date <= DATE '2099-12-31'),
    time_slot text CHECK (char_length(time_slot) <= 100),
    comment text CHECK (char_length(comment) <= 2000),
    client_id uuid REFERENCES public.clients (id),
    vehicle_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bookings_required_details CHECK (type <> 'booking' OR (contact_name IS NOT NULL AND service_name IS NOT NULL)),
    CONSTRAINT consultations_without_schedule CHECK (type <> 'consultation' OR (booking_date IS NULL AND time_slot IS NULL)),
    CONSTRAINT booking_vehicle_requires_client CHECK (vehicle_id IS NULL OR client_id IS NOT NULL),
    CONSTRAINT booking_vehicle_belongs_to_client FOREIGN KEY (client_id, vehicle_id)
        REFERENCES public.vehicles (client_id, id)
);

CREATE INDEX bookings_client_vehicle_idx ON public.bookings (client_id, vehicle_id);

CREATE TABLE public.admin_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    display_name text NOT NULL CHECK (char_length(display_name) <= 120 AND display_name ~ '[^[:space:]]'),
    role text NOT NULL DEFAULT 'manager' CHECK (role IN ('manager', 'admin', 'superadmin')),
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE public.clients, public.vehicles, public.bookings, public.admin_profiles
    FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT (id, role, is_active) ON public.admin_profiles TO authenticated;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Membership depends only on the caller's own Auth user ID.
CREATE POLICY read_own_active_profile ON public.admin_profiles
    FOR SELECT TO authenticated USING (is_active AND id = (SELECT auth.uid()));

CREATE POLICY staff_read_classes ON public.car_classes
    FOR SELECT TO authenticated USING ((
        SELECT EXISTS (
            SELECT 1 FROM public.admin_profiles AS profile
            WHERE profile.id = auth.uid() AND profile.is_active
        )
    ));
CREATE POLICY staff_read_services ON public.services
    FOR SELECT TO authenticated USING ((
        SELECT EXISTS (
            SELECT 1 FROM public.admin_profiles AS profile
            WHERE profile.id = auth.uid() AND profile.is_active
        )
    ));
CREATE POLICY staff_read_packages ON public.service_packages
    FOR SELECT TO authenticated USING ((
        SELECT EXISTS (
            SELECT 1 FROM public.admin_profiles AS profile
            WHERE profile.id = auth.uid() AND profile.is_active
        )
    ));

-- This role can write only the request snapshot, using the table's defaults for status and links.
GRANT INSERT (id, type, contact_phone, contact_name, car_model, service_name, booking_date, time_slot, comment)
    ON public.bookings TO service_role;

CREATE FUNCTION public.create_booking_request(
    p_type text,
    p_phone text,
    p_name text DEFAULT NULL,
    p_car text DEFAULT NULL,
    p_service text DEFAULT NULL,
    p_date date DEFAULT NULL,
    p_slot text DEFAULT NULL,
    p_comment text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    booking_id uuid := pg_catalog.gen_random_uuid();
BEGIN
    INSERT INTO public.bookings (
        id, type, contact_phone, contact_name, car_model, service_name, booking_date, time_slot, comment
    )
    VALUES (
        booking_id, p_type, p_phone, NULLIF(pg_catalog.btrim(p_name), ''),
        NULLIF(pg_catalog.btrim(p_car), ''), NULLIF(pg_catalog.btrim(p_service), ''), p_date,
        NULLIF(pg_catalog.btrim(p_slot), ''), NULLIF(pg_catalog.btrim(p_comment), '')
    );
    RETURN booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_request(text, text, text, text, text, date, text, text)
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_request(text, text, text, text, text, date, text, text)
    TO service_role;
