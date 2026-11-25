BEGIN;
SET LOCAL search_path = public, extensions;
SET LOCAL TIME ZONE 'America/Los_Angeles';

SELECT plan(28);

-- Isolate clock behavior from the quotas tested in 06_booking_protection.test.sql.
UPDATE premiumwash_private.booking_protection_settings
SET phone_short_limit = 100, phone_long_limit = 100, endpoint_limit = 100;

-- Replace only the clock boundary inside the test transaction. Validation uses the actual RPC.
CREATE OR REPLACE FUNCTION premiumwash_private.booking_now()
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = pg_catalog, pg_temp
AS $$ SELECT pg_catalog.current_setting('premiumwash.test_booking_now')::timestamptz $$;

SET LOCAL ROLE service_role;

SET LOCAL "premiumwash.test_booking_now" = '2026-11-25 09:59:59+00';

SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-11-25","slotId":"10:00-12:00"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'An already started interval is open one second before its Kyiv end'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2027-02-23"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'Kyiv today plus exactly 90 calendar days is accepted'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2027-02-24"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW010', 'DATE_OUT_OF_RANGE', 'Kyiv today plus 91 calendar days is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-11-24","slotId":"night_by_arrangement"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW010', 'DATE_OUT_OF_RANGE', 'Night by arrangement cannot use a past calendar date'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-11-31"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW009', 'INVALID_DATE', 'A nonexistent calendar date is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"25.11.2026"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW009', 'INVALID_DATE', 'A localized date is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"infinity"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW009', 'INVALID_DATE', 'A value without an ISO calendar date is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-11-25","slotId":"10:00 — 12:00 (Ранок)"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW011', 'INVALID_SLOT', 'Slot labels are not accepted as identifiers'
);

SET LOCAL "premiumwash.test_booking_now" = '2026-11-25 10:00:00+00';

SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-11-25","slotId":"10:00-12:00"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW012', 'SLOT_EXPIRED', 'An interval is expired at its exact Kyiv end'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-11-25","slotId":"12:00-15:00"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'The next interval is still accepted at that instant'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"slotId":"10:00-12:00"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'The same slot with no date remains a preference'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-11-25"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'A date is accepted without an optional slot'
);

SET LOCAL "premiumwash.test_booking_now" = '2026-07-14 20:59:59+00';

SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-07-14","slotId":"19:00-23:00"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW012', 'SLOT_EXPIRED', 'A summer evening compares to Kyiv local time, not UTC'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-07-14","slotId":"21:00-00:00"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'The cross-midnight interval is still open one second before Kyiv midnight'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-07-14","slotId":"night_by_arrangement"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'Night by arrangement remains available until the Kyiv date changes'
);

SET LOCAL "premiumwash.test_booking_now" = '2026-07-14 21:00:00+00';

SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-07-14","slotId":"21:00-00:00"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW010', 'DATE_OUT_OF_RANGE', 'Kyiv midnight closes the prior date and its cross-midnight interval'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-07-14","slotId":"night_by_arrangement"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW010', 'DATE_OUT_OF_RANGE', 'Night by arrangement expires when the Kyiv date changes'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2026-07-15","slotId":"10:00-12:00"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'The new Kyiv date is accepted even while the session time zone has the prior date'
);

SET LOCAL "premiumwash.test_booking_now" = '2099-12-31 07:00:00+00';

SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000021","name":"Тестове ім’я","selection":{"kind":"individual"},"date":"2100-01-01"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'The relative horizon replaces the old fixed year limit'
);

SELECT lives_ok(
    format('SELECT public.create_booking_request(%L::jsonb, encode(extensions.gen_random_bytes(32), ''hex''))', jsonb_build_object(
        'type', 'booking', 'phone', '+380500000022', 'name', 'Тестове ім’я',
        'selection', '{"kind":"individual"}'::jsonb, 'slotId', slot_id
    )),
    'The server accepts the existing undated slot ' || slot_id
)
FROM (VALUES
    ('10:00-12:00'),
    ('12:00-15:00'),
    ('15:00-18:00'),
    ('18:00-21:00'),
    ('21:00-00:00'),
    ('15:00-19:00'),
    ('19:00-23:00'),
    ('night_by_arrangement')
) AS slots(slot_id);

RESET ROLE;

SELECT results_eq(
    $$SELECT time_slot FROM public.bookings
      WHERE contact_phone = '+380500000022' AND booking_date IS NULL ORDER BY time_slot$$,
    ARRAY['10:00-12:00'::text, '12:00-15:00'::text, '15:00-18:00'::text, '15:00-19:00'::text, '18:00-21:00'::text, '19:00-23:00'::text, '21:00-00:00'::text, 'night_by_arrangement'::text],
    'All eight preferences are stored as stable IDs without an invented date'
);
SELECT * FROM finish();
ROLLBACK;
