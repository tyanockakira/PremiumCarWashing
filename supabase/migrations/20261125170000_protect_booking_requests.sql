CREATE TABLE premiumwash_private.booking_protection_settings (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    lock_token boolean NOT NULL DEFAULT false,
    phone_short_limit integer NOT NULL CHECK (phone_short_limit > 0),
    phone_short_seconds integer NOT NULL CHECK (phone_short_seconds > 0),
    phone_long_limit integer NOT NULL CHECK (phone_long_limit > 0),
    phone_long_seconds integer NOT NULL CHECK (phone_long_seconds >= phone_short_seconds),
    endpoint_limit integer NOT NULL CHECK (endpoint_limit > 0),
    endpoint_seconds integer NOT NULL CHECK (endpoint_seconds > 0),
    idempotency_seconds integer NOT NULL CHECK (idempotency_seconds > 0),
    hmac_secret bytea NOT NULL CHECK (octet_length(hmac_secret) = 32)
);

INSERT INTO premiumwash_private.booking_protection_settings (
    phone_short_limit, phone_short_seconds, phone_long_limit, phone_long_seconds,
    endpoint_limit, endpoint_seconds, idempotency_seconds, hmac_secret
)
VALUES (3, 900, 10, 86400, 30, 60, 86400, extensions.gen_random_bytes(32));

CREATE TABLE premiumwash_private.booking_protection_events (
    booking_id uuid PRIMARY KEY REFERENCES public.bookings (id),
    key_mac bytea NOT NULL CHECK (octet_length(key_mac) = 32),
    phone_mac bytea NOT NULL CHECK (octet_length(phone_mac) = 32),
    request_mac bytea NOT NULL CHECK (octet_length(request_mac) = 32),
    accepted_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL CHECK (expires_at > accepted_at)
);

CREATE INDEX booking_protection_by_key ON premiumwash_private.booking_protection_events (key_mac, expires_at DESC);
CREATE INDEX booking_protection_by_phone ON premiumwash_private.booking_protection_events (phone_mac, accepted_at DESC);
CREATE INDEX booking_protection_by_time ON premiumwash_private.booking_protection_events (accepted_at DESC);

REVOKE ALL ON TABLE premiumwash_private.booking_protection_settings, premiumwash_private.booking_protection_events
    FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON premiumwash_private.booking_protection_settings TO premiumwash_request_writer;
GRANT UPDATE (lock_token) ON premiumwash_private.booking_protection_settings TO premiumwash_request_writer;
GRANT SELECT, INSERT, DELETE ON premiumwash_private.booking_protection_events TO premiumwash_request_writer;
GRANT USAGE ON SCHEMA extensions TO premiumwash_request_writer;

-- Read wall time after obtaining the admission lock, including time spent waiting for it.
CREATE OR REPLACE FUNCTION premiumwash_private.booking_now()
RETURNS timestamptz
LANGUAGE sql
VOLATILE
SET search_path = pg_catalog, pg_temp
AS $$ SELECT pg_catalog.clock_timestamp() $$;

CREATE FUNCTION premiumwash_private.normalize_booking_request(p_request jsonb)
RETURNS jsonb
LANGUAGE plpgsql
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
    date_input text;
    slot_id text;
    canonical jsonb;
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

    selection := p_request->'selection';
    IF selection->>'kind' = 'package'
        AND pg_catalog.jsonb_typeof(selection->'id') = 'string'
        AND pg_catalog.pg_input_is_valid(selection->>'id', 'pg_catalog.uuid')
    THEN
        selection := pg_catalog.jsonb_set(selection, '{id}', pg_catalog.to_jsonb((selection->>'id')::uuid));
    END IF;

    canonical := pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
        'type', request_type, 'phone', phone, 'name', contact_name, 'car', car_model, 'comment', request_comment,
        'carClassId', car_class, 'date', NULLIF(date_input, ''), 'slotId', slot_id
    ));
    IF selection IS NOT NULL THEN
        canonical := canonical || pg_catalog.jsonb_build_object('selection', selection);
    END IF;
    RETURN canonical;
END;
$$;

-- Only called after normalization and admission. Validate current catalog and time only for a new request.
CREATE FUNCTION premiumwash_private.persist_booking_request(p_request jsonb, p_now timestamptz)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    controls constant text := U&'[\0001-\001F\007F-\009F]';
    request_type text := p_request->>'type';
    phone text := p_request->>'phone';
    contact_name text := p_request->>'name';
    car_model text := p_request->>'car';
    request_comment text := p_request->>'comment';
    selection jsonb;
    car_class text := p_request->>'carClassId';
    selected_service uuid;
    selected_package uuid;
    service_name text;
    date_input text := p_request->>'date';
    booking_date date;
    slot_id text := p_request->>'slotId';
    slot_end time;
    kyiv_now timestamp;
    booking_id uuid;
BEGIN
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

        IF date_input IS NOT NULL THEN
            IF date_input !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                OR NOT pg_catalog.pg_input_is_valid(date_input, 'pg_catalog.date')
            THEN
                RAISE EXCEPTION USING ERRCODE = 'PW009', MESSAGE = 'INVALID_DATE';
            END IF;
            booking_date := date_input::date;
            kyiv_now := pg_catalog.timezone('Europe/Kyiv', p_now);
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

REVOKE ALL ON FUNCTION premiumwash_private.normalize_booking_request(jsonb),
    premiumwash_private.persist_booking_request(jsonb, timestamptz) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION premiumwash_private.normalize_booking_request(jsonb),
    premiumwash_private.persist_booking_request(jsonb, timestamptz) TO premiumwash_request_writer;

-- Drop the previous write entry point as its owner, then return to the migration role.
GRANT premiumwash_request_writer TO CURRENT_USER WITH SET TRUE;
SET LOCAL ROLE premiumwash_request_writer;
DROP FUNCTION public.create_booking_request(jsonb);
RESET ROLE;

CREATE FUNCTION public.create_booking_request(p_request jsonb, p_idempotency_key text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
SET lock_timeout = '3s'
AS $$
DECLARE
    canonical jsonb;
    settings premiumwash_private.booking_protection_settings%ROWTYPE;
    previous premiumwash_private.booking_protection_events%ROWTYPE;
    v_key_mac bytea;
    v_phone_mac bytea;
    v_request_mac bytea;
    v_accepted_at timestamptz;
    retry_at timestamptz;
    keep_seconds integer;
    booking_id uuid;
BEGIN
    IF p_idempotency_key IS NULL OR pg_catalog.length(p_idempotency_key) <> 64
        OR p_idempotency_key !~ '^[0-9a-f]{64}$'
    THEN
        RAISE EXCEPTION USING ERRCODE = 'PW014', MESSAGE = 'INVALID_IDEMPOTENCY_KEY';
    END IF;

    canonical := premiumwash_private.normalize_booking_request(p_request);

    BEGIN
        -- A real row update serializes admission and prevents stale decisions under stricter isolation.
        UPDATE premiumwash_private.booking_protection_settings AS policy
        SET lock_token = NOT policy.lock_token
        WHERE policy.singleton
        RETURNING policy.* INTO STRICT settings;

        v_accepted_at := premiumwash_private.booking_now();
        IF v_accepted_at IS NULL OR NOT pg_catalog.isfinite(v_accepted_at) THEN
            RAISE EXCEPTION 'Missing admission time';
        END IF;
        v_key_mac := extensions.hmac(pg_catalog.convert_to('key:v1:' || p_idempotency_key, 'UTF8'), settings.hmac_secret, 'sha256');
        v_phone_mac := extensions.hmac(pg_catalog.convert_to('phone:v1:' || (canonical->>'phone'), 'UTF8'), settings.hmac_secret, 'sha256');
        v_request_mac := extensions.hmac(pg_catalog.convert_to('request:v1:' || canonical::text, 'UTF8'), settings.hmac_secret, 'sha256');

        SELECT event.* INTO previous
        FROM premiumwash_private.booking_protection_events AS event
        WHERE event.key_mac = v_key_mac AND event.expires_at > v_accepted_at
        ORDER BY event.expires_at DESC
        LIMIT 1;

        IF previous.booking_id IS NULL THEN
            -- For each full window, its Nth most recent event determines when one place opens.
            SELECT max(window_state.releases_at) INTO retry_at
            FROM (
                (SELECT event.accepted_at + pg_catalog.make_interval(secs => settings.phone_short_seconds) AS releases_at
                 FROM premiumwash_private.booking_protection_events AS event
                 WHERE event.phone_mac = v_phone_mac
                   AND event.accepted_at > v_accepted_at - pg_catalog.make_interval(secs => settings.phone_short_seconds)
                 ORDER BY event.accepted_at DESC OFFSET (settings.phone_short_limit - 1) LIMIT 1)
                UNION ALL
                (SELECT event.accepted_at + pg_catalog.make_interval(secs => settings.phone_long_seconds)
                 FROM premiumwash_private.booking_protection_events AS event
                 WHERE event.phone_mac = v_phone_mac
                   AND event.accepted_at > v_accepted_at - pg_catalog.make_interval(secs => settings.phone_long_seconds)
                 ORDER BY event.accepted_at DESC OFFSET (settings.phone_long_limit - 1) LIMIT 1)
                UNION ALL
                (SELECT event.accepted_at + pg_catalog.make_interval(secs => settings.endpoint_seconds)
                 FROM premiumwash_private.booking_protection_events AS event
                 WHERE event.accepted_at > v_accepted_at - pg_catalog.make_interval(secs => settings.endpoint_seconds)
                 ORDER BY event.accepted_at DESC OFFSET (settings.endpoint_limit - 1) LIMIT 1)
            ) AS window_state;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION USING ERRCODE = 'PW017', MESSAGE = 'PROTECTION_UNAVAILABLE';
    END;

    IF previous.booking_id IS NOT NULL THEN
        IF previous.request_mac <> v_request_mac THEN
            RAISE EXCEPTION USING ERRCODE = 'PW015', MESSAGE = 'IDEMPOTENCY_CONFLICT';
        END IF;
        RETURN previous.booking_id;
    END IF;

    IF retry_at IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'PW016', MESSAGE = 'RATE_LIMITED',
            DETAIL = GREATEST(1, ceil(EXTRACT(EPOCH FROM (retry_at - v_accepted_at))))::text;
    END IF;

    booking_id := premiumwash_private.persist_booking_request(canonical, v_accepted_at);

    BEGIN
        INSERT INTO premiumwash_private.booking_protection_events (booking_id, key_mac, phone_mac, request_mac, accepted_at, expires_at)
        VALUES (booking_id, v_key_mac, v_phone_mac, v_request_mac, v_accepted_at,
                v_accepted_at + pg_catalog.make_interval(secs => settings.idempotency_seconds));

        keep_seconds := GREATEST(settings.phone_long_seconds, settings.endpoint_seconds);
        DELETE FROM premiumwash_private.booking_protection_events AS event
        WHERE event.booking_id IN (
            SELECT expired.booking_id
            FROM premiumwash_private.booking_protection_events AS expired
            WHERE expired.expires_at <= v_accepted_at
              AND expired.accepted_at <= v_accepted_at - pg_catalog.make_interval(secs => keep_seconds)
            ORDER BY expired.accepted_at, expired.booking_id
            LIMIT 256
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION USING ERRCODE = 'PW017', MESSAGE = 'PROTECTION_UNAVAILABLE';
    END;

    RETURN booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_request(jsonb, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_request(jsonb, text) TO service_role;

GRANT CREATE ON SCHEMA public TO premiumwash_request_writer;
ALTER FUNCTION public.create_booking_request(jsonb, text) OWNER TO premiumwash_request_writer;
REVOKE CREATE ON SCHEMA public FROM premiumwash_request_writer;
REVOKE SET OPTION FOR premiumwash_request_writer FROM CURRENT_USER;
