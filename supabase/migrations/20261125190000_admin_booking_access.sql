CREATE FUNCTION public.admin_list_bookings()
RETURNS TABLE (
    id uuid,
    type text,
    status text,
    contact_phone text,
    contact_name text,
    car_model text,
    service_name text,
    booking_date date,
    time_slot text,
    comment text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.admin_profiles AS profile
        WHERE profile.id = (SELECT auth.uid()) AND profile.is_active
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ADMIN_ACCESS_REQUIRED';
    END IF;

    RETURN QUERY
    SELECT request.id, request.type, request.status, request.contact_phone,
           request.contact_name, request.car_model, request.service_name,
           request.booking_date, request.time_slot, request.comment, request.created_at
    FROM public.bookings AS request
    ORDER BY request.created_at DESC, request.id DESC;
END;
$$;

CREATE FUNCTION public.admin_update_booking_status(p_booking_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.admin_profiles AS profile
        WHERE profile.id = (SELECT auth.uid()) AND profile.is_active
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ADMIN_ACCESS_REQUIRED';
    END IF;

    IF p_status IS NULL OR p_status NOT IN ('new', 'confirmed', 'in_progress', 'completed', 'cancelled') THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_BOOKING_STATUS';
    END IF;

    UPDATE public.bookings
    SET status = p_status
    WHERE id = p_booking_id;

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_bookings() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_update_booking_status(uuid, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_booking_status(uuid, text) TO authenticated;
