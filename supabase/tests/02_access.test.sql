BEGIN;

SET LOCAL search_path = public, extensions;

SELECT plan(30);
SELECT has_table('public', 'clients', 'Client cards have a dedicated table');
SELECT has_table('public', 'vehicles', 'Client vehicles have a dedicated table');
SELECT has_table('public', 'bookings', 'Bookings and consultations have a dedicated table');
SELECT has_table('public', 'admin_profiles', 'Administrative profiles have a dedicated table');
SELECT is(
    (SELECT count(*) FROM pg_class AS relation JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
     WHERE namespace.nspname = 'public' AND relation.relrowsecurity
       AND relation.relname IN ('car_classes', 'services', 'service_packages', 'clients', 'vehicles', 'bookings', 'admin_profiles')),
    7::bigint, 'RLS is enabled on every business table'
);

INSERT INTO auth.users (id, email)
VALUES ('20000000-0000-4000-8000-000000000001', 'public-reader@example.invalid'),
       ('20000000-0000-4000-8000-000000000002', 'active-staff@example.invalid'),
       ('20000000-0000-4000-8000-000000000003', 'inactive-staff@example.invalid');
INSERT INTO public.admin_profiles (id, display_name, role, is_active)
VALUES ('20000000-0000-4000-8000-000000000002', 'Тестовий працівник', 'manager', true),
       ('20000000-0000-4000-8000-000000000003', 'Неактивний працівник', 'admin', false);
INSERT INTO public.car_classes (id, label, is_active)
VALUES ('pgtap-active', 'Тестовий активний клас', true),
       ('pgtap-inactive', 'Тестовий прихований клас', false);
INSERT INTO public.services (slug, title, base_price, is_active)
VALUES ('pgtap-active', 'Тестова активна послуга', 100, true),
       ('pgtap-inactive', 'Тестова прихована послуга', 100, false);
INSERT INTO public.service_packages (id, title, base_price, is_active)
VALUES ('20000000-0000-4000-8000-000000000004', 'Тестовий активний пакет', 100, true),
       ('20000000-0000-4000-8000-000000000005', 'Тестовий прихований пакет', 100, false);

SET LOCAL ROLE anon;
SELECT throws_ok('SELECT * FROM public.clients', '42501', NULL, 'Anonymous users cannot read client cards');
SELECT throws_ok('SELECT * FROM public.vehicles', '42501', NULL, 'Anonymous users cannot read vehicles');
SELECT throws_ok('SELECT * FROM public.bookings', '42501', NULL, 'Anonymous users cannot read booking snapshots');
SELECT throws_ok(
    $$INSERT INTO public.bookings (type, contact_phone) VALUES ('consultation', '+380500000001')$$,
    '42501', NULL, 'Anonymous users cannot write a booking directly'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}';
SELECT is(
    (SELECT count(*) FROM public.car_classes WHERE id IN ('pgtap-active', 'pgtap-inactive')),
    1::bigint, 'An ordinary authenticated user sees only the active class'
);
SELECT is(
    (SELECT count(*) FROM public.services WHERE slug IN ('pgtap-active', 'pgtap-inactive')),
    1::bigint, 'An ordinary authenticated user sees only the active service'
);
SELECT is(
    (SELECT count(*) FROM public.service_packages WHERE id IN (
        '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005'
    )),
    1::bigint, 'An ordinary authenticated user sees only the active package'
);
SELECT is((SELECT count(id) FROM public.admin_profiles), 0::bigint, 'An ordinary user has no administrative membership');
SELECT throws_ok('SELECT * FROM public.bookings', '42501', NULL, 'An ordinary user cannot read booking snapshots');
SELECT throws_ok(
    $$INSERT INTO public.bookings (type, contact_phone) VALUES ('consultation', '+380500000001')$$,
    '42501', NULL, 'An ordinary user cannot write a booking directly'
);
SELECT throws_ok(
    $$INSERT INTO public.admin_profiles (id, display_name, role, is_active)
      VALUES (auth.uid(), 'Тестовий профіль', 'superadmin', true)$$,
    '42501', NULL, 'An ordinary user cannot create an elevated profile'
);

SET LOCAL "request.jwt.claims" = '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}';
SELECT results_eq(
    'SELECT role FROM public.admin_profiles',
    ARRAY['manager'::text], 'An active employee sees only their own role without recursion'
);
SELECT is(
    (SELECT count(*) FROM public.car_classes WHERE id = 'pgtap-inactive'),
    1::bigint, 'An active employee can read an unpublished class'
);
SELECT is(
    (SELECT count(*) FROM public.services WHERE slug = 'pgtap-inactive'),
    1::bigint, 'An active employee can read an unpublished service'
);
SELECT is(
    (SELECT count(*) FROM public.service_packages WHERE id = '20000000-0000-4000-8000-000000000005'),
    1::bigint, 'An active employee can read an unpublished package'
);
SELECT throws_ok('SELECT display_name FROM public.admin_profiles', '42501', NULL, 'An employee cannot read profile names directly');
SELECT throws_ok('SELECT * FROM public.clients', '42501', NULL, 'An employee cannot read client cards directly');
SELECT throws_ok('SELECT * FROM public.vehicles', '42501', NULL, 'An employee cannot read vehicles directly');
SELECT throws_ok('SELECT * FROM public.bookings', '42501', NULL, 'An employee cannot read booking snapshots directly');
SELECT throws_ok(
    $$UPDATE public.clients SET full_name = 'Тестова зміна'$$,
    '42501', NULL, 'An employee cannot edit client cards directly'
);
SELECT throws_ok(
    $$UPDATE public.admin_profiles SET role = 'superadmin' WHERE id = auth.uid()$$,
    '42501', NULL, 'An employee cannot promote their own role'
);
SELECT throws_ok(
    $$UPDATE public.services SET is_active = true WHERE slug = 'pgtap-inactive'$$,
    '42501', NULL, 'An employee cannot change the catalog directly'
);

SET LOCAL "request.jwt.claims" = '{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}';
SELECT is((SELECT count(id) FROM public.admin_profiles), 0::bigint, 'An inactive employee has no active membership');
SELECT is(
    (SELECT count(*) FROM public.services WHERE slug = 'pgtap-inactive'),
    0::bigint, 'An inactive employee cannot access unpublished services'
);
SELECT throws_ok(
    $$UPDATE public.admin_profiles SET is_active = true WHERE id = auth.uid()$$,
    '42501', NULL, 'An inactive employee cannot reactivate their own profile'
);

RESET ROLE;
SELECT * FROM finish();

ROLLBACK;
