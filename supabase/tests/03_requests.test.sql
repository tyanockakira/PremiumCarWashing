BEGIN;

SET LOCAL search_path = public, extensions;

SELECT plan(30);
SELECT has_function(
    'public', 'create_booking_request', ARRAY['jsonb', 'text'],
    'The server has a single request entry point'
);
SELECT ok(
    NOT EXISTS (
        SELECT 1 FROM pg_proc AS routine
        CROSS JOIN LATERAL aclexplode(coalesce(routine.proacl, acldefault('f', routine.proowner))) AS privilege
        WHERE routine.oid = to_regprocedure('public.create_booking_request(jsonb,text)')
          AND privilege.grantee = 0 AND privilege.privilege_type = 'EXECUTE'
    ),
    'PUBLIC has no EXECUTE grant on the request RPC'
);
SELECT ok(
    NOT has_function_privilege('anon', to_regprocedure('public.create_booking_request(jsonb,text)'), 'EXECUTE'),
    'anon has no effective EXECUTE privilege on the request RPC'
);
SELECT ok(
    NOT has_function_privilege('authenticated', to_regprocedure('public.create_booking_request(jsonb,text)'), 'EXECUTE'),
    'authenticated has no effective EXECUTE privilege on the request RPC'
);
SELECT ok(
    has_function_privilege('service_role', to_regprocedure('public.create_booking_request(jsonb,text)'), 'EXECUTE'),
    'The server role can execute the request RPC'
);
SELECT ok(
    NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE pronamespace = 'public'::regnamespace
          AND proname IN ('submit_booking', 'submit_consultation')
    ),
    'Historical write RPCs are absent'
);

SET LOCAL ROLE anon;
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000001"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    '42501', NULL, 'Anonymous users cannot call the request RPC'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000001"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    '42501', NULL, 'Authenticated users cannot call the request RPC'
);
RESET ROLE;

INSERT INTO public.clients (id, full_name, phone)
VALUES ('30000000-0000-4000-8000-000000000001', 'Початкове ім’я', '+380500000001'),
       ('30000000-0000-4000-8000-000000000002', 'Інший тестовий клієнт', '+380500000002');
INSERT INTO public.vehicles (id, client_id, make_model)
VALUES ('30000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'Тестовий седан'),
       ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'Тестовий кросовер');
INSERT INTO public.services (slug, title, base_price)
VALUES ('pgtap-polishing', 'Полірування', 100);

SET LOCAL ROLE service_role;
SELECT ok(
    public.create_booking_request('{
        "type":"booking","phone":"+380500000001","name":" Ім’я із заявки ","car":"Тестова модель",
        "selection":{"kind":"service","slug":"pgtap-polishing"},"comment":"Тестовий коментар"
    }', encode(extensions.gen_random_bytes(32), 'hex')) IS NOT NULL,
    'The server accepts a booking and returns its ID'
);
SELECT ok(
    public.create_booking_request('{"type":"consultation","phone":"+380500000001"}', encode(extensions.gen_random_bytes(32), 'hex')) IS NOT NULL,
    'The server accepts a phone-only consultation and returns its ID'
);
SELECT ok(
    public.create_booking_request('{"type":"consultation","phone":"+380500000003"}', encode(extensions.gen_random_bytes(32), 'hex')) IS NOT NULL,
    'A phone-only consultation also works without a matching client'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380100000001"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW002', 'INVALID_PHONE', 'An invalid Ukrainian phone is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"booking","phone":"+380500000001","selection":{"kind":"individual"}}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW003', 'NAME_REQUIRED', 'A booking requires a name'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{
        "type":"booking","phone":"+380500000001","name":"Тестове ім’я","selection":{"kind":"service","slug":""}
    }', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW006', 'INVALID_SELECTION', 'A booking with a service selection requires a nonblank service identifier'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"unknown","phone":"+380500000001"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW001', 'INVALID_REQUEST', 'An unsupported request type is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"+380500000001","date":"2099-01-01"}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW001', 'INVALID_REQUEST', 'A consultation cannot have a booking schedule'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request(jsonb_build_object(
        'type', 'consultation', 'phone', '+380500000001', 'question', repeat('a', 2001)
    ), encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW004', 'TEXT_TOO_LONG', 'An oversized question is rejected'
);
SELECT throws_ok('SELECT * FROM public.bookings', '42501', NULL, 'The server role cannot read request snapshots directly');
SELECT throws_ok(
    $$INSERT INTO public.bookings (type, status, contact_phone) VALUES ('consultation', 'confirmed', '+380500000001')$$,
    '42501', NULL, 'The request-writing role cannot set a privileged status'
);
SELECT throws_ok(
    $$INSERT INTO public.bookings (type, contact_phone, client_id)
      VALUES ('consultation', '+380500000001', '30000000-0000-4000-8000-000000000001')$$,
    '42501', NULL, 'The request-writing role cannot attach a known client'
);
RESET ROLE;

SELECT is(
    (SELECT full_name FROM public.clients WHERE id = '30000000-0000-4000-8000-000000000001'),
    'Початкове ім’я', 'A matching phone does not change the existing client name'
);
SELECT is(
    (SELECT count(*) FROM public.vehicles WHERE client_id IN (
        '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002'
    )),
    2::bigint, 'Submitting a car model does not add a vehicle to a client card'
);
SELECT is(
    (SELECT count(*) FROM public.clients WHERE phone = '+380500000003'),
    0::bigint, 'The consultation does not create a placeholder client'
);
SELECT results_eq(
    $$SELECT contact_name, car_model, status, client_id, vehicle_id FROM public.bookings
      WHERE contact_phone = '+380500000001' AND type = 'booking' AND comment = 'Тестовий коментар'$$,
    $$VALUES ('Ім’я із заявки'::text, 'Тестова модель'::text, 'new'::text, NULL::uuid, NULL::uuid)$$,
    'The booking stores the submitted snapshot without identity links'
);
SELECT results_eq(
    $$SELECT contact_name, client_id, vehicle_id FROM public.bookings
      WHERE contact_phone = '+380500000001' AND type = 'consultation'$$,
    $$VALUES (NULL::text, NULL::uuid, NULL::uuid)$$,
    'The phone-only consultation stores no invented name or identity link'
);
SELECT throws_ok(
    $$UPDATE public.bookings SET vehicle_id = '30000000-0000-4000-8000-000000000003'
      WHERE contact_phone = '+380500000001' AND type = 'booking' AND comment = 'Тестовий коментар'$$,
    '23514', NULL, 'A vehicle link requires a client link'
);
SELECT throws_ok(
    $$UPDATE public.bookings
      SET client_id = '30000000-0000-4000-8000-000000000001', vehicle_id = '30000000-0000-4000-8000-000000000004'
      WHERE contact_phone = '+380500000001' AND type = 'booking' AND comment = 'Тестовий коментар'$$,
    '23503', NULL, 'A vehicle linked to a request must belong to the linked client'
);
SELECT lives_ok(
    $$UPDATE public.bookings
      SET client_id = '30000000-0000-4000-8000-000000000001', vehicle_id = '30000000-0000-4000-8000-000000000003'
      WHERE contact_phone = '+380500000001' AND type = 'booking' AND comment = 'Тестовий коментар'$$,
    'A trusted database owner can link the matching client and vehicle'
);
SELECT throws_ok(
    $$INSERT INTO public.clients (full_name, phone) VALUES ('Повтор номера', '+380500000001')$$,
    '23505', NULL, 'Client cards cannot duplicate a canonical phone'
);
SELECT throws_ok(
    $$UPDATE public.bookings SET status = 'invalid'
      WHERE contact_phone = '+380500000001' AND type = 'booking' AND comment = 'Тестовий коментар'$$,
    '23514', NULL, 'An invalid booking status is rejected'
);

SELECT * FROM finish();

ROLLBACK;
