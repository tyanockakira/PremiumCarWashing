BEGIN;
SET LOCAL search_path = public, extensions;

SELECT plan(48);

INSERT INTO public.car_classes (id, label, is_active)
VALUES ('pgtap-class-active', 'Тестовий клас', true),
       ('pgtap-class-inactive', 'Прихований тестовий клас', false);
INSERT INTO public.services (slug, title, base_price, is_active)
VALUES ('pgtap-active', 'Послуга із каталогу', 100, true),
       ('pgtap-inactive', 'Прихована тестова послуга', 100, false),
       ('pgtap-bad-title', repeat('а', 201), 100, true);
INSERT INTO public.service_packages (id, title, base_price, is_active)
VALUES ('73000000-0000-4000-8000-000000000001', 'Пакет із каталогу', 100, true),
       ('73000000-0000-4000-8000-000000000002', 'Прихований тестовий пакет', 100, false);

-- Force a genuine database rejection without changing the production constraints.
ALTER TABLE public.bookings ADD CONSTRAINT pgtap_write_rejected
    CHECK (comment IS DISTINCT FROM 'Тестовий збій запису') NOT VALID;

SELECT ok(
    to_regprocedure('public.create_booking_request(text,text,text,text,text,date,text,text)') IS NULL,
    'The old unchecked RPC signature is gone'
);
SELECT ok(
    NOT pg_has_role('service_role', 'premiumwash_request_writer', 'SET')
        AND NOT pg_has_role('anon', 'premiumwash_request_writer', 'SET')
        AND NOT pg_has_role('authenticated', 'premiumwash_request_writer', 'SET'),
    'API roles cannot assume the writer identity'
);
SELECT ok(
    NOT has_any_column_privilege('service_role', 'public.bookings', 'INSERT'),
    'The server role has no remaining column-level direct insert grants'
);
SELECT ok(
    (SELECT NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole
     FROM pg_roles WHERE rolname = 'premiumwash_request_writer'),
    'The writer credential cannot log in or bypass row security'
);
SELECT ok(
    NOT has_schema_privilege('premiumwash_request_writer', 'public', 'CREATE')
        AND NOT has_any_column_privilege('premiumwash_request_writer', 'public.clients', 'SELECT')
        AND NOT has_any_column_privilege('premiumwash_request_writer', 'public.services', 'UPDATE'),
    'The writer cannot create objects, read client cards, or edit the catalog'
);
SELECT ok(
    NOT has_schema_privilege('service_role', 'premiumwash_private', 'USAGE'),
    'The server role cannot use the private clock schema'
);

SET LOCAL ROLE service_role;
SELECT throws_ok(
    $$SELECT public.create_booking_request('{
        "type":"booking","phone":"+380500000011","name":"Ім’я","selection":{"kind":"service","slug":"pgtap-absent"}
    }', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW007', 'CATALOG_ITEM_UNAVAILABLE', 'Unknown catalog choices are rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{
        "type":"booking","phone":"+380500000011","name":"Ім’я","selection":{"kind":"individual"},"date":"2000-01-01"
    }', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW010', 'DATE_OUT_OF_RANGE', 'A date in the past is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{
        "type":"booking","phone":"+380500000011","name":"Ім’я","selection":{"kind":"individual"},"date":"2099-01-01"
    }', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW010', 'DATE_OUT_OF_RANGE', 'A date outside the booking horizon is rejected'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('{
        "type":"booking","phone":"+380500000011","name":"Ім’я","selection":{"kind":"individual"},"slotId":"08:00-09:00"
    }', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW011', 'INVALID_SLOT', 'An unknown slot is rejected even without a date'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request(pg_catalog.jsonb_build_object(
        'type', 'consultation', 'phone', '+380500000011', 'name', E'Ім’я\tТест'
    ), encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW005', 'INVALID_CONTROL_CHARACTERS', 'A control character cannot be saved in a name'
);
SELECT throws_ok(
    $$INSERT INTO public.bookings (type, contact_phone) VALUES ('consultation', '+380500000011')$$,
    '42501', NULL, 'The server role cannot write a snapshot outside the RPC'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request('consultation'::text, '+380500000011'::text)$$,
    '42883', NULL, 'The server role cannot call the previous signature'
);
SELECT throws_ok(
    $$UPDATE public.bookings SET comment = 'Тестова зміна'$$,
    '42501', NULL, 'The server role cannot update a snapshot directly'
);
SELECT throws_ok(format('SELECT public.create_booking_request(%L::jsonb, encode(extensions.gen_random_bytes(32), ''hex''))', payload), code, message, description)
FROM (VALUES
    ($json$[]$json$::jsonb, 'PW001', 'INVALID_REQUEST', 'A JSON array is rejected'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"individual"},"price":1}$json$::jsonb, 'PW001', 'INVALID_REQUEST', 'A supplied price is rejected'),
    ($json${"type":"consultation","phone":380500000011}$json$::jsonb, 'PW001', 'INVALID_REQUEST', 'A numeric phone is rejected instead of coerced'),
    ($json${"type":"consultation","phone":"  "}$json$::jsonb, 'PW002', 'INVALID_PHONE', 'A blank phone is rejected'),
    ($json${"type":"consultation","phone":"+480 50 000 00 11"}$json$::jsonb, 'PW002', 'INVALID_PHONE', 'A foreign phone prefix is rejected'),
    ($json${"type":"consultation","phone":"067 123 45 6a"}$json$::jsonb, 'PW002', 'INVALID_PHONE', 'Letters are rejected in the phone'),
    ($json${"type":"booking","phone":"+380500000011","name":"  ","selection":{"kind":"individual"}}$json$::jsonb, 'PW003', 'NAME_REQUIRED', 'A name made only of Unicode spaces is rejected'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":null}$json$::jsonb, 'PW006', 'INVALID_SELECTION', 'A booking must choose one selection'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"service","slug":"pgtap-active","id":"73000000-0000-4000-8000-000000000001"}}$json$::jsonb, 'PW006', 'INVALID_SELECTION', 'A service and package cannot be combined'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"individual","slug":"pgtap-active"}}$json$::jsonb, 'PW006', 'INVALID_SELECTION', 'Individual selection cannot be combined with a service'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"service","slug":"pgtap-active","title":"Підмінений заголовок"}}$json$::jsonb, 'PW006', 'INVALID_SELECTION', 'A caller cannot override a catalog title'),
    ($json${"type":"consultation","phone":"+380500000011","carClassId":"pgtap-class-active"}$json$::jsonb, 'PW001', 'INVALID_REQUEST', 'A consultation cannot include a car class'),
    ($json${"type":"consultation","phone":"+380500000011","selection":{"kind":"individual"}}$json$::jsonb, 'PW001', 'INVALID_REQUEST', 'A consultation cannot include a catalog selection'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"service","slug":"pgtap-inactive"}}$json$::jsonb, 'PW007', 'CATALOG_ITEM_UNAVAILABLE', 'An inactive service is rejected'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"service","slug":"pgtap-bad-title"}}$json$::jsonb, 'PW007', 'CATALOG_ITEM_UNAVAILABLE', 'An invalid catalog caption yields a safe error'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"package","id":"invalid"}}$json$::jsonb, 'PW006', 'INVALID_SELECTION', 'An invalid package UUID yields a safe error'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"package","id":"73000000-0000-4000-8000-000000000099"}}$json$::jsonb, 'PW007', 'CATALOG_ITEM_UNAVAILABLE', 'A nonexistent package is rejected'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"package","id":"73000000-0000-4000-8000-000000000002"}}$json$::jsonb, 'PW007', 'CATALOG_ITEM_UNAVAILABLE', 'An inactive package is rejected'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"individual"},"carClassId":"pgtap-class-missing"}$json$::jsonb, 'PW008', 'CAR_CLASS_UNAVAILABLE', 'A nonexistent class is rejected'),
    ($json${"type":"booking","phone":"+380500000011","name":"Тестове ім’я","selection":{"kind":"individual"},"carClassId":"pgtap-class-inactive"}$json$::jsonb, 'PW008', 'CAR_CLASS_UNAVAILABLE', 'An inactive class is rejected'),
    ($json${"type":"consultation","phone":"+380500000011","question":"Тестовий збій запису"}$json$::jsonb, 'PW013', 'REQUEST_WRITE_REJECTED', 'A write constraint violation exposes only a stable error')
) AS scenarios(payload, code, message, description);

SELECT throws_ok(
    $$SELECT public.create_booking_request(jsonb_build_object(
        'type', 'consultation', 'phone', '+380500000011', 'question', U&'Текст\0085після'
    ), encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW005', 'INVALID_CONTROL_CHARACTERS', 'C1 control characters are rejected in questions'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request(jsonb_build_object(
        'type', 'consultation', 'phone', '+380500000011', 'name', repeat('ї', 121)
    ), encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW004', 'TEXT_TOO_LONG', 'A name cannot exceed 120 characters'
);
SELECT throws_ok(
    $$SELECT public.create_booking_request(jsonb_build_object(
        'type', 'consultation', 'phone', '+380500000011', 'car', repeat('ї', 161)
    ), encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'PW004', 'TEXT_TOO_LONG', 'A car model cannot exceed 160 characters'
);

SELECT lives_ok(
    $$SELECT public.create_booking_request(jsonb_build_object(
        'type', 'consultation', 'phone', U&'050\00A0(000)\201112.12',
        'name', repeat('ї', 120), 'car', repeat('ї', 160), 'question', repeat('ї', 2000)
    ), encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'Exact Unicode lengths and the supported phone separators are accepted'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request(jsonb_build_object(
        'type', 'booking', 'phone', '00380 (50) 000-00-13', 'name', ' Мар’яна Анна-Лі 王 ',
        'selection', '{"kind":"package","id":"73000000-0000-4000-8000-000000000001"}'::jsonb,
        'carClassId', 'pgtap-class-active', 'car', ' Тестова модель ', 'comment', E'Перший рядок\r\nДругий рядок'
    ), encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'A booking accepts a package, optional class and an international Unicode name'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{"type":"consultation","phone":"380 50 000 00 14","name":" ","car":null}', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'A bare Ukrainian prefix works for a consultation with optional fields blank'
);
SELECT lives_ok(
    $$SELECT public.create_booking_request('{
        "type":"booking","phone":"+380500000015","name":"Тестове ім’я","selection":{"kind":"individual"},"slotId":"night_by_arrangement"
    }', encode(extensions.gen_random_bytes(32), 'hex'))$$,
    'Individual selection and an undated time preference are preserved'
);

RESET ROLE;

SELECT results_eq(
    $$SELECT char_length(contact_name), char_length(car_model), char_length(comment)
      FROM public.bookings WHERE contact_phone = '+380500001212'$$,
    $$VALUES (120, 160, 2000)$$,
    'Lengths and the canonical phone are stored in the snapshot'
);
SELECT results_eq(
    $$SELECT contact_name, car_model, service_name, car_class_id, service_package_id, comment, client_id
      FROM public.bookings WHERE contact_phone = '+380500000013'$$,
    $$VALUES ('Мар’яна Анна-Лі 王'::text, 'Тестова модель'::text, 'Пакет із каталогу'::text, 'pgtap-class-active'::text,
              '73000000-0000-4000-8000-000000000001'::uuid, E'Перший рядок\nДругий рядок'::text, NULL::uuid)$$,
    'The snapshot uses the catalog title, normalized contact data and no client link'
);
SELECT results_eq(
    $$SELECT contact_name, car_model, comment, booking_date, time_slot
      FROM public.bookings WHERE contact_phone = '+380500000014'$$,
    $$VALUES (NULL::text, NULL::text, NULL::text, NULL::date, NULL::text)$$,
    'Empty optional consultation fields are stored as null'
);
SELECT results_eq(
    $$SELECT service_name, service_id, service_package_id, time_slot, booking_date
      FROM public.bookings WHERE contact_phone = '+380500000015'$$,
    $$VALUES ('Індивідуальний підбір із технологом'::text, NULL::uuid, NULL::uuid, 'night_by_arrangement'::text, NULL::date)$$,
    'The individual selection has no catalog link and keeps the slot ID without a date'
);
SELECT is(
    (SELECT count(*) FROM public.bookings WHERE contact_phone = '+380500000011'),
    0::bigint, 'Rejected calls, including a failed insert, leave no partial row'
);
SELECT throws_ok(
    $$INSERT INTO public.bookings (type, contact_phone, contact_name, service_name, service_id, service_package_id)
      SELECT 'booking', '+380500000011', 'Тестове ім’я', 'Тестовий вибір', id, '73000000-0000-4000-8000-000000000001'
      FROM public.services WHERE slug = 'pgtap-active'$$,
    '23514', NULL, 'The table itself rejects simultaneous service and package links'
);

SELECT * FROM finish();
ROLLBACK;
