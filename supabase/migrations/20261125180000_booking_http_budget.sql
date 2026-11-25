-- The role is cluster-wide and can outlive a reset of the project database.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'premiumwash_http_gate') THEN
        CREATE ROLE premiumwash_http_gate NOLOGIN NOINHERIT NOBYPASSRLS;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_roles AS gate
        WHERE gate.rolname = 'premiumwash_http_gate'
          AND (gate.rolcanlogin OR gate.rolinherit OR gate.rolsuper OR gate.rolbypassrls
               OR gate.rolcreaterole OR gate.rolcreatedb OR gate.rolreplication
               OR EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members WHERE member = gate.oid)
               OR EXISTS (
                   SELECT 1 FROM pg_catalog.pg_auth_members AS membership
                   JOIN pg_catalog.pg_roles AS member ON member.oid = membership.member
                   WHERE membership.roleid = gate.oid
                     AND (member.rolname <> CURRENT_USER OR membership.set_option OR membership.inherit_option)
               ))
    ) THEN
        RAISE EXCEPTION 'Unexpected PremiumWash HTTP gate privileges';
    END IF;
END;
$$;

CREATE TABLE premiumwash_private.booking_http_budget (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    admitted_at timestamptz[] NOT NULL DEFAULT '{}'
        CHECK (cardinality(admitted_at) <= 120 AND array_position(admitted_at, NULL::timestamptz) IS NULL)
);

INSERT INTO premiumwash_private.booking_http_budget DEFAULT VALUES;

ALTER TABLE premiumwash_private.booking_http_budget ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE premiumwash_private.booking_http_budget
    FROM PUBLIC, anon, authenticated, service_role, premiumwash_request_writer;

GRANT USAGE ON SCHEMA public, premiumwash_private TO premiumwash_http_gate;
GRANT SELECT, UPDATE (admitted_at) ON premiumwash_private.booking_http_budget TO premiumwash_http_gate;
GRANT EXECUTE ON FUNCTION premiumwash_private.booking_now() TO premiumwash_http_gate;

CREATE POLICY http_gate_read ON premiumwash_private.booking_http_budget
    FOR SELECT TO premiumwash_http_gate USING (singleton);
CREATE POLICY http_gate_update ON premiumwash_private.booking_http_budget
    FOR UPDATE TO premiumwash_http_gate USING (singleton) WITH CHECK (singleton);

-- Zero admits the attempt. A positive result is the retry delay in seconds.
CREATE FUNCTION public.admit_booking_http_attempt()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
SET lock_timeout = '1s'
AS $$
DECLARE
    window_length constant interval := INTERVAL '60 seconds';
    attempt_limit constant integer := 120;
    arrivals timestamptz[];
    now_at timestamptz;
BEGIN
    SELECT budget.admitted_at INTO STRICT arrivals
    FROM premiumwash_private.booking_http_budget AS budget
    WHERE budget.singleton
    FOR UPDATE;

    now_at := premiumwash_private.booking_now();
    IF now_at IS NULL OR NOT pg_catalog.isfinite(now_at) THEN
        RAISE EXCEPTION 'Invalid HTTP admission clock';
    END IF;

    SELECT coalesce(pg_catalog.array_agg(arrival ORDER BY arrival), '{}'::timestamptz[])
    INTO arrivals
    FROM pg_catalog.unnest(arrivals) AS active(arrival)
    WHERE arrival > now_at - window_length;

    IF pg_catalog.cardinality(arrivals) >= attempt_limit THEN
        RETURN greatest(1, pg_catalog.ceil(EXTRACT(EPOCH FROM (arrivals[1] + window_length - now_at))))::integer;
    END IF;

    UPDATE premiumwash_private.booking_http_budget AS budget
    SET admitted_at = pg_catalog.array_append(arrivals, now_at)
    WHERE budget.singleton;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'HTTP admission state unavailable';
    END IF;
    RETURN 0;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'PW017', MESSAGE = 'PROTECTION_UNAVAILABLE';
END;
$$;

REVOKE ALL ON FUNCTION public.admit_booking_http_attempt() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admit_booking_http_attempt() TO service_role;

GRANT premiumwash_http_gate TO CURRENT_USER WITH SET TRUE;
GRANT CREATE ON SCHEMA public TO premiumwash_http_gate;
ALTER FUNCTION public.admit_booking_http_attempt() OWNER TO premiumwash_http_gate;
REVOKE CREATE ON SCHEMA public FROM premiumwash_http_gate;
REVOKE SET OPTION FOR premiumwash_http_gate FROM CURRENT_USER;
