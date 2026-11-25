-- The writer role survives a database reset, so reuse only a role with the expected isolation.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'premiumwash_request_writer') THEN
        CREATE ROLE premiumwash_request_writer NOLOGIN NOINHERIT NOBYPASSRLS;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_roles AS writer
        WHERE writer.rolname = 'premiumwash_request_writer'
          AND (writer.rolcanlogin OR writer.rolinherit OR writer.rolsuper OR writer.rolbypassrls
               OR writer.rolcreaterole OR writer.rolcreatedb OR writer.rolreplication
               OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members WHERE member = writer.oid)
               OR EXISTS (
                   SELECT 1 FROM pg_catalog.pg_auth_members AS membership
                   JOIN pg_catalog.pg_roles AS member ON member.oid = membership.member
                   WHERE membership.roleid = writer.oid
                     AND (member.rolname <> CURRENT_USER OR membership.set_option OR membership.inherit_option)
               ))
    ) THEN
        RAISE EXCEPTION 'Unexpected PremiumWash request writer privileges';
    END IF;
END;
$$;

ALTER TABLE public.bookings
    DROP CONSTRAINT bookings_booking_date_check,
    ADD COLUMN car_class_id text REFERENCES public.car_classes (id),
    ADD COLUMN service_id uuid REFERENCES public.services (id),
    ADD COLUMN service_package_id uuid REFERENCES public.service_packages (id),
    ADD CONSTRAINT bookings_catalog_selection CHECK (
        num_nonnulls(service_id, service_package_id) <= 1
        AND (type = 'booking' OR num_nonnulls(car_class_id, service_id, service_package_id) = 0)
    );

REVOKE INSERT ON TABLE public.bookings FROM service_role;
REVOKE INSERT (id, type, contact_phone, contact_name, car_model, service_name, booking_date, time_slot, comment)
    ON public.bookings FROM service_role;

DROP FUNCTION public.create_booking_request(text, text, text, text, text, date, text, text);

CREATE SCHEMA premiumwash_private;
REVOKE ALL ON SCHEMA premiumwash_private FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public, premiumwash_private TO premiumwash_request_writer;

-- A private clock boundary lets tests fix an instant inside a rolled-back transaction.
CREATE FUNCTION premiumwash_private.booking_now()
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = pg_catalog, pg_temp
AS $$ SELECT pg_catalog.statement_timestamp() $$;

REVOKE ALL ON FUNCTION premiumwash_private.booking_now() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION premiumwash_private.booking_now() TO premiumwash_request_writer;

GRANT SELECT (id, label, is_active) ON public.car_classes TO premiumwash_request_writer;
GRANT SELECT (id, slug, title, is_active) ON public.services TO premiumwash_request_writer;
GRANT SELECT (id, title, is_active) ON public.service_packages TO premiumwash_request_writer;
GRANT INSERT (
    id, type, contact_phone, contact_name, car_model, service_name, booking_date, time_slot,
    comment, car_class_id, service_id, service_package_id
) ON public.bookings TO premiumwash_request_writer;

CREATE POLICY request_writer_read_classes ON public.car_classes
    FOR SELECT TO premiumwash_request_writer USING (is_active);
CREATE POLICY request_writer_read_services ON public.services
    FOR SELECT TO premiumwash_request_writer USING (is_active);
CREATE POLICY request_writer_read_packages ON public.service_packages
    FOR SELECT TO premiumwash_request_writer USING (is_active);
CREATE POLICY request_writer_insert_snapshot ON public.bookings
    FOR INSERT TO premiumwash_request_writer
    WITH CHECK (status = 'new' AND client_id IS NULL AND vehicle_id IS NULL);

CREATE FUNCTION public.create_booking_request(p_request jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    whitespace constant text := U&'\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\202F\205F\3000\FEFF';
    controls constant text := U&'[\0001-\001F\007F-\009F]';
    allowed_fields text[];
    request_type text;
    phone text;
    phone_prefix text[];
    contact_name text;
    car_model text;
    request_comment text;
    selection jsonb;
    car_class text;
    selected_service uuid;
    selected_package uuid;
    service_name text;
    date_input text;
    booking_date date;
    slot_id text;
    slot_end time;
    kyiv_now timestamp;
    booking_id uuid;
BEGIN
    IF pg_catalog.jsonb_typeof(p_request) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION USING ERRCODE = 'PW001', MESSAGE = 'INVALID_REQUEST';
    END IF;

    request_type := p_request->>'type';
    IF request_type = 'booking' THEN
        allowed_fields := ARRAY['type', 'phone', 'name', 'car', 'selection', 'carClassId', 'date', 'slotId', 'comment'];
    ELSIF request_type = 'consultation' THEN
        allowed_fields := ARRAY['type', 'phone', 'name', 'car', 'question'];
    ELSE
        RAISE EXCEPTION USING ERRCODE = 'PW001', MESSAGE = 'INVALID_REQUEST';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_each(p_request) AS field(key, value)
        WHERE field.key <> ALL (allowed_fields)
           OR (field.key <> 'selection' AND pg_catalog.jsonb_typeof(field.value) NOT IN ('string', 'null'))
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'PW001', MESSAGE = 'INVALID_REQUEST';
    END IF;

    phone := p_request->>'phone';
    contact_name := p_request->>'name';
    car_model := p_request->>'car';
    car_class := p_request->>'carClassId';
    date_input := p_request->>'date';
    slot_id := p_request->>'slotId';
    request_comment := pg_catalog.replace(
        CASE WHEN request_type = 'booking' THEN p_request->>'comment' ELSE p_request->>'question' END,
        E'\r\n', E'\n'
    );

    IF pg_catalog.concat(phone, contact_name, car_model, car_class, date_input, slot_id) ~ controls
        OR pg_catalog.replace(request_comment, E'\n', '') ~ controls
    THEN
        RAISE EXCEPTION USING ERRCODE = 'PW005', MESSAGE = 'INVALID_CONTROL_CHARACTERS';
    END IF;

    phone := pg_catalog.translate(phone, whitespace || U&'().\002D\2010\2011\2012\2013\2014\2015', '');
    phone_prefix := pg_catalog.regexp_match(phone, '^(?:0|[+]?380|00380)([3-9][0-9]{8})$');
    IF phone_prefix IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'PW002', MESSAGE = 'INVALID_PHONE';
    END IF;
    phone := '+380' || phone_prefix[1];

    contact_name := NULLIF(pg_catalog.btrim(contact_name, whitespace), '');
    car_model := NULLIF(pg_catalog.btrim(car_model, whitespace), '');
    request_comment := NULLIF(pg_catalog.btrim(request_comment, whitespace || E'\n'), '');

    IF request_type = 'booking' AND contact_name IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'PW003', MESSAGE = 'NAME_REQUIRED';
    END IF;
    IF pg_catalog.char_length(contact_name) > 120
        OR pg_catalog.char_length(car_model) > 160
        OR pg_catalog.char_length(request_comment) > 2000
    THEN
        RAISE EXCEPTION USING ERRCODE = 'PW004', MESSAGE = 'TEXT_TOO_LONG';
    END IF;

    IF request_type = 'booking' THEN
        selection := p_request->'selection';
        IF pg_catalog.jsonb_typeof(selection) IS DISTINCT FROM 'object' THEN
            RAISE EXCEPTION USING ERRCODE = 'PW006', MESSAGE = 'INVALID_SELECTION';
        END IF;

        CASE selection->>'kind'
            WHEN 'service' THEN
                IF pg_catalog.jsonb_typeof(selection->'slug') IS DISTINCT FROM 'string'
                    OR NULLIF(selection->>'slug', '') IS NULL
                    OR selection - ARRAY['kind', 'slug'] <> '{}'::jsonb
                THEN
                    RAISE EXCEPTION USING ERRCODE = 'PW006', MESSAGE = 'INVALID_SELECTION';
                END IF;
                SELECT item.id, item.title INTO selected_service, service_name
                FROM public.services AS item
                WHERE item.slug = selection->>'slug' AND item.is_active;
            WHEN 'package' THEN
                IF pg_catalog.jsonb_typeof(selection->'id') IS DISTINCT FROM 'string'
                    OR NOT pg_catalog.pg_input_is_valid(selection->>'id', 'pg_catalog.uuid')
                    OR selection - ARRAY['kind', 'id'] <> '{}'::jsonb
                THEN
                    RAISE EXCEPTION USING ERRCODE = 'PW006', MESSAGE = 'INVALID_SELECTION';
                END IF;
                SELECT item.id, item.title INTO selected_package, service_name
                FROM public.service_packages AS item
                WHERE item.id = (selection->>'id')::uuid AND item.is_active;
            WHEN 'individual' THEN
                IF selection - 'kind' <> '{}'::jsonb THEN
                    RAISE EXCEPTION USING ERRCODE = 'PW006', MESSAGE = 'INVALID_SELECTION';
                END IF;
                service_name := 'Індивідуальний підбір із технологом';
            ELSE
                RAISE EXCEPTION USING ERRCODE = 'PW006', MESSAGE = 'INVALID_SELECTION';
        END CASE;
        IF service_name IS NULL OR pg_catalog.char_length(service_name) > 200
            OR service_name !~ '[^[:space:]]' OR service_name ~ controls
        THEN
            RAISE EXCEPTION USING ERRCODE = 'PW007', MESSAGE = 'CATALOG_ITEM_UNAVAILABLE';
        END IF;

        IF car_class IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.car_classes AS item WHERE item.id = car_class AND item.is_active
        ) THEN
            RAISE EXCEPTION USING ERRCODE = 'PW008', MESSAGE = 'CAR_CLASS_UNAVAILABLE';
        END IF;

        date_input := NULLIF(date_input, '');
        IF date_input IS NOT NULL THEN
            IF date_input !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                OR NOT pg_catalog.pg_input_is_valid(date_input, 'pg_catalog.date')
            THEN
                RAISE EXCEPTION USING ERRCODE = 'PW009', MESSAGE = 'INVALID_DATE';
            END IF;
            booking_date := date_input::date;
            kyiv_now := pg_catalog.timezone('Europe/Kyiv', premiumwash_private.booking_now());
            IF booking_date < kyiv_now::date OR booking_date > kyiv_now::date + 90 THEN
                RAISE EXCEPTION USING ERRCODE = 'PW010', MESSAGE = 'DATE_OUT_OF_RANGE';
            END IF;
        END IF;

        IF slot_id IS NOT NULL AND slot_id <> 'night_by_arrangement' THEN
            slot_end := CASE slot_id
                WHEN '10:00-12:00' THEN TIME '12:00'
                WHEN '12:00-15:00' THEN TIME '15:00'
                WHEN '15:00-18:00' THEN TIME '18:00'
                WHEN '18:00-21:00' THEN TIME '21:00'
                WHEN '21:00-00:00' THEN TIME '24:00'
                WHEN '15:00-19:00' THEN TIME '19:00'
                WHEN '19:00-23:00' THEN TIME '23:00'
            END;
            IF slot_end IS NULL THEN
                RAISE EXCEPTION USING ERRCODE = 'PW011', MESSAGE = 'INVALID_SLOT';
            END IF;
            IF booking_date + slot_end <= kyiv_now THEN
                RAISE EXCEPTION USING ERRCODE = 'PW012', MESSAGE = 'SLOT_EXPIRED';
            END IF;
        END IF;
    END IF;

    booking_id := pg_catalog.gen_random_uuid();
    BEGIN
        INSERT INTO public.bookings (
            id, type, contact_phone, contact_name, car_model, service_name, booking_date, time_slot,
            comment, car_class_id, service_id, service_package_id
        )
        VALUES (
            booking_id, request_type, phone, contact_name, car_model, service_name, booking_date, slot_id,
            request_comment, car_class, selected_service, selected_package
        );
    EXCEPTION WHEN integrity_constraint_violation OR insufficient_privilege THEN
        RAISE EXCEPTION USING ERRCODE = 'PW013', MESSAGE = 'REQUEST_WRITE_REJECTED';
    END;
    RETURN booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_request(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_request(jsonb) TO service_role;

-- PostgreSQL requires both privileges briefly to transfer function ownership.
GRANT premiumwash_request_writer TO CURRENT_USER WITH SET TRUE;
GRANT CREATE ON SCHEMA public TO premiumwash_request_writer;
ALTER FUNCTION public.create_booking_request(jsonb) OWNER TO premiumwash_request_writer;
REVOKE CREATE ON SCHEMA public FROM premiumwash_request_writer;
REVOKE SET OPTION FOR premiumwash_request_writer FROM CURRENT_USER;
