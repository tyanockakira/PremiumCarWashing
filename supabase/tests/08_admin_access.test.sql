BEGIN;

SET LOCAL search_path = public, extensions;
SELECT plan(12);

SELECT has_function('public', 'admin_list_bookings', 'The admin list RPC exists');
SELECT has_function('public', 'admin_update_booking_status', ARRAY['uuid', 'text'], 'The admin status RPC exists');
SELECT ok(
    NOT has_function_privilege('anon', 'public.admin_list_bookings()', 'EXECUTE'),
    'Anonymous users cannot execute the admin list RPC'
);
SELECT ok(
    has_function_privilege('authenticated', 'public.admin_list_bookings()', 'EXECUTE'),
    'Authenticated users can reach the guarded admin list RPC'
);
SELECT ok(
    NOT has_function_privilege('service_role', 'public.admin_list_bookings()', 'EXECUTE'),
    'The browser-facing admin RPC does not grant service_role access'
);
SELECT ok(
    NOT has_function_privilege('anon', 'public.admin_update_booking_status(uuid,text)', 'EXECUTE'),
    'Anonymous users cannot execute the status RPC'
);
SELECT ok(
    has_function_privilege('authenticated', 'public.admin_update_booking_status(uuid,text)', 'EXECUTE'),
    'Authenticated users can reach the guarded status RPC'
);
SELECT ok(
    NOT has_function_privilege('authenticated', 'public.admin_list_bookings()', 'EXECUTE')
       OR EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.admin_list_bookings()'::regprocedure AND prosecdef),
    'The list RPC performs a definer-side membership check'
);
SELECT ok(
    EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.admin_update_booking_status(uuid,text)'::regprocedure AND prosecdef),
    'The status RPC performs a definer-side membership check'
);
SELECT ok(
    NOT has_any_column_privilege('authenticated', 'public.bookings', 'SELECT, UPDATE'),
    'Authenticated users retain no direct bookings table privileges'
);
SELECT ok(
    NOT has_any_column_privilege('anon', 'public.bookings', 'SELECT, UPDATE'),
    'Anonymous users retain no direct bookings table privileges'
);
SELECT ok(
    (SELECT proconfig @> ARRAY['search_path=pg_catalog, pg_temp'] FROM pg_proc WHERE oid = 'public.admin_list_bookings()'::regprocedure),
    'The list RPC pins search_path'
);
SELECT ok(
    (SELECT proconfig @> ARRAY['search_path=pg_catalog, pg_temp'] FROM pg_proc WHERE oid = 'public.admin_update_booking_status(uuid,text)'::regprocedure),
    'The status RPC pins search_path'
);

SELECT * FROM finish();
ROLLBACK;
