BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(18);

SELECT has_function('public', 'admit_booking_http_attempt', ARRAY[]::text[], 'A separate protected HTTP admission boundary exists');

CREATE OR REPLACE FUNCTION premiumwash_private.booking_now()
RETURNS timestamptz
LANGUAGE sql
VOLATILE
SET search_path = pg_catalog, pg_temp
AS $$ SELECT pg_catalog.current_setting('premiumwash.test_http_now')::timestamptz $$;

UPDATE premiumwash_private.booking_http_budget SET admitted_at = '{}' WHERE singleton;

SELECT ok(NOT EXISTS (
    SELECT 1 FROM pg_proc AS routine
    CROSS JOIN LATERAL aclexplode(coalesce(routine.proacl, acldefault('f', routine.proowner))) AS privilege
    WHERE routine.oid = 'public.admit_booking_http_attempt()'::regprocedure AND privilege.grantee = 0
), 'The admission RPC has no PUBLIC grant');

SELECT ok(
    NOT has_function_privilege('anon', 'public.admit_booking_http_attempt()', 'EXECUTE')
        AND NOT has_function_privilege('authenticated', 'public.admit_booking_http_attempt()', 'EXECUTE')
        AND has_function_privilege('service_role', 'public.admit_booking_http_attempt()', 'EXECUTE'),
    'Only the API server role can call the admission RPC'
);
SELECT ok(
    NOT has_any_column_privilege('service_role', 'premiumwash_private.booking_http_budget', 'SELECT, INSERT, UPDATE')
        AND NOT has_any_column_privilege('premiumwash_request_writer', 'premiumwash_private.booking_http_budget', 'SELECT, INSERT, UPDATE'),
    'API server and booking writer have no direct budget access'
);
SELECT ok(
    NOT pg_has_role('service_role', 'premiumwash_http_gate', 'SET')
        AND NOT has_any_column_privilege('premiumwash_http_gate', 'public.bookings', 'SELECT, INSERT, UPDATE')
        AND NOT has_function_privilege('premiumwash_http_gate', 'public.create_booking_request(jsonb,text)', 'EXECUTE')
        AND NOT has_schema_privilege('premiumwash_http_gate', 'public', 'CREATE'),
    'The admission owner cannot be assumed or reach the business write path'
);
SELECT ok(
    (SELECT NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls FROM pg_roles WHERE rolname = 'premiumwash_http_gate'),
    'The admission owner cannot log in or bypass RLS'
);

SET LOCAL ROLE anon;
SELECT throws_ok(
    'SELECT public.admit_booking_http_attempt()', '42501', NULL, 'The anonymous role cannot spend the HTTP budget directly'
);
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT throws_ok(
    'SELECT public.admit_booking_http_attempt()', '42501', NULL, 'The authenticated role cannot spend the HTTP budget directly'
);
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT throws_ok(
    'SELECT admitted_at FROM premiumwash_private.booking_http_budget', '42501', NULL, 'The server role cannot read the stored arrivals'
);
SELECT throws_ok(
    'UPDATE premiumwash_private.booking_http_budget SET admitted_at = ARRAY[]::timestamptz[]',
    '42501', NULL, 'The server role cannot reset the budget'
);

SET LOCAL "premiumwash.test_http_now" = '2026-11-25T12:00:00Z';
SELECT is(public.admit_booking_http_attempt(), 0, 'The first attempt is admitted');

SET LOCAL "premiumwash.test_http_now" = '2026-11-25T12:00:01Z';
SELECT is(
    (SELECT count(*) FROM generate_series(1, 119) WHERE public.admit_booking_http_attempt() = 0),
    119::bigint, 'The budget admits exactly another 119 attempts at the same time'
);
SELECT is(public.admit_booking_http_attempt(), 59, 'The 121st attempt receives the oldest remaining delay');

SET LOCAL "premiumwash.test_http_now" = '2026-11-25T12:00:59.25Z';
SELECT is(public.admit_booking_http_attempt(), 1, 'Retry-After rounds up and never returns zero on denial');

SET LOCAL "premiumwash.test_http_now" = '2026-11-25T12:01:00Z';
SELECT is(public.admit_booking_http_attempt(), 0, 'The first place opens at the exact 60-second boundary');
SELECT is(public.admit_booking_http_attempt(), 1, 'Other arrivals still occupy their places');
RESET ROLE;

SELECT is(
    (SELECT cardinality(admitted_at) FROM premiumwash_private.booking_http_budget WHERE singleton),
    120, 'Denied requests do not make the state grow beyond 120 arrivals'
);

DELETE FROM premiumwash_private.booking_http_budget WHERE singleton;
SET LOCAL ROLE service_role;
SELECT throws_ok(
    'SELECT public.admit_booking_http_attempt()', 'PW017', 'PROTECTION_UNAVAILABLE', 'Missing budget state fails closed'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
