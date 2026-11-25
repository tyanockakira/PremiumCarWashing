BEGIN;

SET LOCAL search_path = public, extensions;

SELECT plan(7);
SELECT has_table('public', 'car_classes', 'Car classes are available to the catalog');
SELECT has_table('public', 'services', 'Services are available to the catalog');
SELECT has_table('public', 'service_packages', 'Packages are available to the catalog');

INSERT INTO public.car_classes (id, label, is_active)
VALUES ('pgtap-active', 'Тестовий активний клас', true),
       ('pgtap-inactive', 'Тестовий прихований клас', false);

INSERT INTO public.services (slug, title, base_price, is_active)
VALUES ('pgtap-active', 'Тестова активна послуга', 100, true),
       ('pgtap-inactive', 'Тестова прихована послуга', 100, false);

INSERT INTO public.service_packages (id, title, base_price, is_active)
VALUES ('10000000-0000-4000-8000-000000000001', 'Тестовий активний пакет', 100, true),
       ('10000000-0000-4000-8000-000000000002', 'Тестовий прихований пакет', 100, false);

SET LOCAL ROLE anon;

SELECT results_eq(
    $$SELECT id FROM public.car_classes WHERE id IN ('pgtap-active', 'pgtap-inactive') ORDER BY id$$,
    ARRAY['pgtap-active'::text],
    'Anonymous catalog readers see only active classes'
);
SELECT results_eq(
    $$SELECT slug FROM public.services WHERE slug IN ('pgtap-active', 'pgtap-inactive') ORDER BY slug$$,
    ARRAY['pgtap-active'::text],
    'Anonymous catalog readers see only active services'
);
SELECT results_eq(
    $$SELECT id FROM public.service_packages WHERE id IN (
        '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002'
    ) ORDER BY id$$,
    ARRAY['10000000-0000-4000-8000-000000000001'::uuid],
    'Anonymous catalog readers see only active packages'
);
SELECT throws_ok(
    $$UPDATE public.services SET is_active = true WHERE slug = 'pgtap-inactive'$$,
    '42501', NULL, 'Anonymous users cannot publish a service'
);

RESET ROLE;
SELECT * FROM finish();

ROLLBACK;
