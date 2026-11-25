BEGIN;
SET LOCAL search_path = public, extensions;
SELECT plan(80);

CREATE OR REPLACE FUNCTION premiumwash_private.booking_now()
RETURNS timestamptz
LANGUAGE sql
VOLATILE
SET search_path = pg_catalog, pg_temp
AS $$ SELECT pg_catalog.current_setting('premiumwash.test_booking_now')::timestamptz $$;

INSERT INTO public.clients (full_name, phone) VALUES ('Тестове ім’я власника картки', '+380500000041');

SELECT has_function(
    'public', 'create_booking_request', ARRAY['jsonb', 'text'],
    'The protected request API requires a separate idempotency key'
);
SELECT ok(
    to_regprocedure('public.create_booking_request(jsonb)') IS NULL,
    'The previous validated but unmetered signature is gone'
);
SELECT ok(
    NOT has_function_privilege('service_role', 'premiumwash_private.persist_booking_request(jsonb,timestamptz)', 'EXECUTE')
        AND NOT has_schema_privilege('service_role', 'premiumwash_private', 'USAGE')
        AND NOT has_any_column_privilege('service_role', 'public.bookings', 'INSERT'),
    'The backend role cannot reach the unprotected writer or insert directly'
);
SELECT ok(NOT EXISTS (
    SELECT 1
    FROM pg_class AS relation
    CROSS JOIN LATERAL aclexplode(coalesce(relation.relacl, acldefault('r', relation.relowner))) AS privilege
    WHERE relation.oid IN (
        'premiumwash_private.booking_protection_settings'::regclass,
        'premiumwash_private.booking_protection_events'::regclass
    ) AND privilege.grantee = 0
), 'PUBLIC has no grants on the protection tables');

SET LOCAL ROLE anon;
SELECT throws_ok(
    $$SELECT * FROM premiumwash_private.booking_protection_events$$,
    '42501', NULL, 'Anonymous users cannot inspect idempotency records'
);
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT throws_ok(
    $$UPDATE premiumwash_private.booking_protection_settings SET endpoint_limit = 999$$,
    '42501', NULL, 'Authenticated users cannot change the policy'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT throws_ok(
    $$SELECT hmac_secret FROM premiumwash_private.booking_protection_settings$$,
    '42501', NULL, 'The API service role cannot read the HMAC secret'
);
SELECT throws_ok(
    $$DELETE FROM premiumwash_private.booking_protection_events$$,
    '42501', NULL, 'The API service role cannot clear admission history'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000041"}')$$,
    '42883', NULL, 'Calling the unmetered signature fails at runtime'
);

SET LOCAL "premiumwash.test_booking_now" = '2026-12-01 12:00:00+00';
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000041","question":"Перший рядок\nДругий рядок"}', NULL)$$,
    'PW014', 'INVALID_IDEMPOTENCY_KEY', 'A missing idempotency key is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000041","question":"Перший рядок\nДругий рядок"}', repeat('A', 64))$$,
    'PW014', 'INVALID_IDEMPOTENCY_KEY', 'Uppercase hexadecimal keys are outside the contract'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000041","question":"Перший рядок\nДругий рядок"}', repeat('a', 63))$$,
    'PW014', 'INVALID_IDEMPOTENCY_KEY', 'A short key is rejected'
);
SELECT lives_ok(
    $$SELECT set_config('premiumwash.test_id', public.create_booking_request('{"type":"consultation","phone":"+380500000041","question":"Перший рядок\nДругий рядок"}', repeat('a', 64))::text, true)$$,
    'The first protected submission returns a UUID'
);
SELECT is(
    public.create_booking_request('{"type":"consultation","phone":"+380500000041","question":"Перший рядок\nДругий рядок"}', repeat('a', 64))::text,
    current_setting('premiumwash.test_id'), 'An exact retry returns the first UUID'
);
SELECT is(
    public.create_booking_request('{"type":"consultation","phone":"050 (000) 00-41","question":"  Перший рядок\r\nДругий рядок  ","name":null}', repeat('a', 64))::text,
    current_setting('premiumwash.test_id'), 'Equivalent contact and text formats replay the same UUID'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000041","question":"Змінене запитання"}', repeat('a', 64))$$,
    'PW015', 'IDEMPOTENCY_CONFLICT', 'The same key with different text conflicts'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000042","question":"Перший рядок\nДругий рядок"}', repeat('a', 64))$$,
    'PW015', 'IDEMPOTENCY_CONFLICT', 'A key cannot be used to retrieve a different phone''s submission'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000041","name":"Тестове ім’я","selection":{"kind":"individual"}}', repeat('b', 64))$$,
    'A booking shares the same phone budget as a consultation'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000041"}', repeat('c', 64))$$,
    'The third unique submission is accepted after multiple replays'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000041","name":"Тестове ім’я","selection":{"kind":"individual"}}', repeat('d', 64))$$,
    'PW016', 'RATE_LIMITED', 'The fourth unique submission is rejected across request types'
);
DO $$
DECLARE delay_seconds text;
BEGIN
    PERFORM public.create_booking_request('{"type":"booking","phone":"+380500000041","name":"Тестове ім’я","selection":{"kind":"individual"}}', repeat('d', 64));
EXCEPTION WHEN SQLSTATE 'PW016' THEN
    GET STACKED DIAGNOSTICS delay_seconds = PG_EXCEPTION_DETAIL;
    PERFORM set_config('premiumwash.test_delay', delay_seconds, true);
END;
$$;
SELECT is(current_setting('premiumwash.test_delay', true), '900', 'The phone window gives a numeric Retry-After in seconds');
SELECT is(
    public.create_booking_request('{"type":"consultation","phone":"+380500000041","question":"Перший рядок\nДругий рядок"}', repeat('a', 64))::text,
    current_setting('premiumwash.test_id'), 'A successful retry bypasses an exhausted new-submission quota'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000042"}', repeat('e', 64))$$,
    'A different phone has its own quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-01 12:15:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000041","name":"Тестове ім’я","selection":{"kind":"individual"}}', repeat('d', 64))$$,
    'The rolling phone window opens at its exact boundary'
);

SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 00:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('200', 64, '0'))$$,
    'Daily fixture 1 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 02:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('201', 64, '0'))$$,
    'Daily fixture 2 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 04:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('202', 64, '0'))$$,
    'Daily fixture 3 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 06:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('203', 64, '0'))$$,
    'Daily fixture 4 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 08:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('204', 64, '0'))$$,
    'Daily fixture 5 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 10:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('205', 64, '0'))$$,
    'Daily fixture 6 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 12:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('206', 64, '0'))$$,
    'Daily fixture 7 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 14:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('207', 64, '0'))$$,
    'Daily fixture 8 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 16:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('208', 64, '0'))$$,
    'Daily fixture 9 is within the shared phone quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 18:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', lpad('209', 64, '0'))$$,
    'Daily fixture 10 is within the shared phone quota'
);

SET LOCAL "premiumwash.test_booking_now" = '2026-12-03 18:15:00+00';
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', repeat('f', 64))$$,
    'PW016', 'RATE_LIMITED', 'An eleventh phone submission is blocked by the 24-hour window'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-04 00:00:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000043"}', repeat('f', 64))$$,
    'The oldest phone event expires at exactly 24 hours'
);


SET LOCAL "premiumwash.test_booking_now" = '2026-12-06 00:00:00+00';
SELECT lives_ok(
    format('SELECT public.create_booking_request(%L::jsonb, %L)', jsonb_build_object(
        'type', 'consultation', 'phone', '+380510000' || lpad(n::text, 3, '0')
    ), lpad((300 + n)::text, 64, '0')),
    'A unique endpoint submission is accepted at position ' || n
)
FROM generate_series(1, 30) AS positions(n);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000044"}', repeat('1', 64))$$,
    'PW016', 'RATE_LIMITED', 'A distinct phone cannot exceed the shared endpoint quota'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-06 00:01:00+00';
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000044"}', repeat('1', 64))$$,
    'The endpoint quota opens at exactly 60 seconds'
);


SET LOCAL "premiumwash.test_booking_now" = '2026-12-08 00:00:00+00';
SELECT lives_ok(
    $$SELECT set_config('premiumwash.test_expiring_id', public.create_booking_request('{"type":"consultation","phone":"+380500000045"}', repeat('2', 64))::text, true)$$,
    'A fresh key is recorded with a 24-hour lifetime'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-08 23:59:59+00';
SELECT is(
    public.create_booking_request('{"type":"consultation","phone":"+380500000045"}', repeat('2', 64))::text,
    current_setting('premiumwash.test_expiring_id'), 'The key is still valid just before 24 hours'
);
SET LOCAL "premiumwash.test_booking_now" = '2026-12-09 00:00:00+00';
SELECT isnt(
    public.create_booking_request('{"type":"consultation","phone":"+380500000045"}', repeat('2', 64))::text,
    current_setting('premiumwash.test_expiring_id'), 'The same key can start a new submission at expiry'
);

RESET ROLE;

ALTER TABLE premiumwash_private.booking_protection_events
    ADD CONSTRAINT pgtap_reject_protection_event CHECK (accepted_at <> TIMESTAMPTZ '2026-12-11 00:00:00+00') NOT VALID;

SET LOCAL ROLE service_role;
SET LOCAL "premiumwash.test_booking_now" = '2026-12-11 00:00:00+00';
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000046"}', repeat('3', 64))$$,
    'PW017', 'PROTECTION_UNAVAILABLE', 'An event insert failure rejects the entire request'
);
RESET ROLE;

SELECT is(
    (SELECT count(*) FROM public.bookings WHERE contact_phone = '+380500000046'),
    0::bigint, 'An event insert failure rolls back the newly inserted booking'
);
SELECT is(
    (SELECT count(*) FROM premiumwash_private.booking_protection_events WHERE accepted_at = TIMESTAMPTZ '2026-12-11 00:00:00+00'),
    0::bigint, 'An event insert failure leaves no idempotency record'
);

ALTER TABLE premiumwash_private.booking_protection_events DROP CONSTRAINT pgtap_reject_protection_event;

SET LOCAL ROLE service_role;
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000046"}', repeat('3', 64))$$,
    'A failed atomic request can use the same key after recovery'
);
RESET ROLE;

REVOKE SELECT ON premiumwash_private.booking_protection_settings FROM premiumwash_request_writer;
SET LOCAL ROLE service_role;
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000047"}', repeat('4', 64))$$,
    'PW017', 'PROTECTION_UNAVAILABLE', 'Inaccessible rules cause the request to fail closed'
);
RESET ROLE;

SELECT is(
    (SELECT count(*) FROM public.bookings WHERE contact_phone = '+380500000047'),
    0::bigint, 'Unavailable protection never leaves a booking'
);
SELECT is(
    (SELECT full_name FROM public.clients WHERE phone = '+380500000041'),
    'Тестове ім’я власника картки', 'Repeated submissions do not alter an existing client card'
);
SELECT is(
    (SELECT count(*) FROM public.bookings WHERE contact_phone = '+380500000041' AND client_id IS NOT NULL),
    0::bigint, 'Neither new submissions nor retries link to an existing client'
);
SELECT is(
    (SELECT count(*) FROM premiumwash_private.booking_protection_events
     WHERE accepted_at < TIMESTAMPTZ '2026-12-09 00:00:00+00'
       AND expires_at <= TIMESTAMPTZ '2026-12-10 00:00:00+00'),
    0::bigint, 'Admission prunes records outside all current windows and the idempotency period'
);

SELECT * FROM finish();
ROLLBACK;
