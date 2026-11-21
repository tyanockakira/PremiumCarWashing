-- ==============================================================================
-- СХЕМА БАЗИ ДАНИХ ДЛЯ ДЕТЕЙЛІНГ-ЦЕНТРУ PREMIUM CAR WASH (SUPABASE POSTGRESQL)
-- ДЕМОНСТРАЦІЙНА ВІТРИННА СИСТЕМА
-- ==============================================================================

-- 1. ТАБЛИЦЯ: Класи автомобілів (для калькулятора)
CREATE TABLE IF NOT EXISTS public.car_classes (
    id TEXT PRIMARY KEY, -- 'sedan', 'crossover', 'suv'
    label TEXT NOT NULL,
    multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    example_models TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ТАБЛИЦЯ: Послуги дітейлінгу (каталог)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tag TEXT,
    description TEXT,
    base_price INTEGER NOT NULL,
    duration_text TEXT,
    features TEXT[] DEFAULT '{}',
    image_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ТАБЛИЦЯ: Пакети послуг (для калькулятора)
CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    tag TEXT,
    base_price INTEGER NOT NULL,
    time_text TEXT,
    description TEXT,
    items TEXT[] DEFAULT '{}',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ТАБЛИЦЯ: Клієнти
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients (phone);

-- 5. ТАБЛИЦЯ: Автомобілі клієнтів
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    car_class_id TEXT REFERENCES public.car_classes(id) ON DELETE SET NULL,
    make_model TEXT NOT NULL,
    license_plate TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_client ON public.vehicles (client_id);

-- 6. ТАБЛИЦЯ: Заявки на запис та консультації
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    booking_date DATE,
    time_slot TEXT,
    comment TEXT,
    type TEXT NOT NULL DEFAULT 'booking' CHECK (type IN ('booking', 'consultation')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings (created_at DESC);

-- 7. ТАБЛИЦЯ: Профілі адміністраторів
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('superadmin', 'admin', 'manager')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- БЕЗПЕКА: ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.car_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Публічне читання каталогу (будь-який відвідувач бачить активні послуги та ціни)
CREATE POLICY "Public read active car_classes"
    ON public.car_classes FOR SELECT USING (true);

CREATE POLICY "Public read active services"
    ON public.services FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active service_packages"
    ON public.service_packages FOR SELECT USING (is_active = true);

-- Політики для авторизованих адміністраторів (повний доступ)
CREATE POLICY "Admins full access car_classes"
    ON public.car_classes FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Admins full access services"
    ON public.services FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Admins full access service_packages"
    ON public.service_packages FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Admins full access clients"
    ON public.clients FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Admins full access vehicles"
    ON public.vehicles FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Admins full access bookings"
    ON public.bookings FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Admins full access admin_profiles"
    ON public.admin_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ==============================================================================
-- БЕЗПЕЧНІ ФУНКЦІЇ (RPC) ДЛЯ ПУБЛІЧНОЇ ВІДПРАВКИ ЗАЯВОК БЕЗ ВИТОКУ ДАНИХ
-- ==============================================================================

-- Функція 1: Оформлення запису через форму бронювання
CREATE OR REPLACE FUNCTION public.submit_booking(
    p_name TEXT,
    p_phone TEXT,
    p_car TEXT,
    p_service TEXT,
    p_date DATE DEFAULT NULL,
    p_slot TEXT DEFAULT NULL,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
    v_client_id UUID;
    v_vehicle_id UUID := NULL;
    v_booking_id UUID;
BEGIN
    -- Валідація вхідних даних
    IF TRIM(COALESCE(p_name, '')) = '' THEN
        RAISE EXCEPTION 'Ім’я обов’язкове для заповнення';
    END IF;

    IF TRIM(COALESCE(p_phone, '')) = '' THEN
        RAISE EXCEPTION 'Номер телефону обов’язковий для заповнення';
    END IF;

    -- Нормалізація телефону (залишаємо тільки цифри)
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_clean_phone) = 10 AND v_clean_phone LIKE '0%' THEN
        v_clean_phone := '+38' || v_clean_phone;
    ELSIF length(v_clean_phone) = 9 THEN
        v_clean_phone := '+380' || v_clean_phone;
    ELSIF length(v_clean_phone) = 12 AND v_clean_phone LIKE '380%' THEN
        v_clean_phone := '+' || v_clean_phone;
    ELSE
        v_clean_phone := '+' || v_clean_phone;
    END IF;

    -- Пошук або створення клієнта
    SELECT id INTO v_client_id FROM public.clients WHERE phone = v_clean_phone LIMIT 1;

    IF v_client_id IS NULL THEN
        INSERT INTO public.clients (full_name, phone)
        VALUES (TRIM(p_name), v_clean_phone)
        RETURNING id INTO v_client_id;
    ELSE
        -- Оновлюємо ім'я, якщо клієнт уже звертався
        UPDATE public.clients
        SET full_name = TRIM(p_name), updated_at = NOW()
        WHERE id = v_client_id;
    END IF;

    -- Створення запису про авто, якщо вказано
    IF TRIM(COALESCE(p_car, '')) <> '' THEN
        INSERT INTO public.vehicles (client_id, make_model)
        VALUES (v_client_id, TRIM(p_car))
        RETURNING id INTO v_vehicle_id;
    END IF;

    -- Створення самої заявки
    INSERT INTO public.bookings (
        client_id,
        vehicle_id,
        service_name,
        booking_date,
        time_slot,
        comment,
        type,
        status
    )
    VALUES (
        v_client_id,
        v_vehicle_id,
        COALESCE(NULLIF(TRIM(p_service), ''), 'Індивідуальна консультація'),
        p_date,
        NULLIF(TRIM(p_slot), ''),
        NULLIF(TRIM(p_comment), ''),
        'booking',
        'new'
    )
    RETURNING id INTO v_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'message', 'Заявка успішно зареєстрована'
    );
END;
$$;

-- Функція 2: Оформлення швидкої заявки/запитання з блоку Контакти
CREATE OR REPLACE FUNCTION public.submit_consultation(
    p_name TEXT,
    p_phone TEXT,
    p_car TEXT DEFAULT NULL,
    p_question TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
    v_client_id UUID;
    v_vehicle_id UUID := NULL;
    v_booking_id UUID;
BEGIN
    IF TRIM(COALESCE(p_name, '')) = '' THEN
        RAISE EXCEPTION 'Ім’я обов’язкове для заповнення';
    END IF;

    IF TRIM(COALESCE(p_phone, '')) = '' THEN
        RAISE EXCEPTION 'Номер телефону обов’язковий для заповнення';
    END IF;

    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_clean_phone) = 10 AND v_clean_phone LIKE '0%' THEN
        v_clean_phone := '+38' || v_clean_phone;
    ELSIF length(v_clean_phone) = 9 THEN
        v_clean_phone := '+380' || v_clean_phone;
    ELSIF length(v_clean_phone) = 12 AND v_clean_phone LIKE '380%' THEN
        v_clean_phone := '+' || v_clean_phone;
    ELSE
        v_clean_phone := '+' || v_clean_phone;
    END IF;

    SELECT id INTO v_client_id FROM public.clients WHERE phone = v_clean_phone LIMIT 1;

    IF v_client_id IS NULL THEN
        INSERT INTO public.clients (full_name, phone)
        VALUES (TRIM(p_name), v_clean_phone)
        RETURNING id INTO v_client_id;
    END IF;

    IF TRIM(COALESCE(p_car, '')) <> '' THEN
        INSERT INTO public.vehicles (client_id, make_model)
        VALUES (v_client_id, TRIM(p_car))
        RETURNING id INTO v_vehicle_id;
    END IF;

    INSERT INTO public.bookings (
        client_id,
        vehicle_id,
        service_name,
        comment,
        type,
        status
    )
    VALUES (
        v_client_id,
        v_vehicle_id,
        'Консультація технолога',
        NULLIF(TRIM(p_question), ''),
        'consultation',
        'new'
    )
    RETURNING id INTO v_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'message', 'Запитання успішно передано майстру'
    );
END;
$$;

-- Надання прав анонімним користувачам на виклик обох процедур
GRANT EXECUTE ON FUNCTION public.submit_booking TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_consultation TO anon, authenticated;

-- ==============================================================================
-- СІДОВІ ДАНІ (SEED DATA): Заповнення базових послуг та тарифів (грн)
-- ==============================================================================

-- Класи авто
INSERT INTO public.car_classes (id, label, multiplier, example_models, sort_order)
VALUES
    ('sedan', 'Седан / Купе', 1.00, 'BMW 3/5, Porsche 911, Mercedes E-Class', 1),
    ('crossover', 'Кросовер', 1.20, 'BMW X3/X5, Porsche Macan/Cayenne', 2),
    ('suv', 'Позашляховик / SUV', 1.40, 'Mercedes G-Class, Range Rover, GLS', 3)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    multiplier = EXCLUDED.multiplier,
    example_models = EXCLUDED.example_models;

-- Послуги каталогу
INSERT INTO public.services (slug, title, tag, description, base_price, duration_text, features, image_url, is_featured, sort_order)
VALUES
    (
        'polishing',
        'Відновлювальне полірування',
        'ГЛИБОКИЙ ГЛЯНЕЦЬ',
        'Багатоетапне видалення подряпин, павутинки та оксидного шару зі збереженням максимальної товщини заводського лаку.',
        8500,
        '1–2 дні',
        ARRAY[
            'Усунення до 98% дефектів і рисок',
            'Пасти та полірувальні круги Rupes & Koch Chemie',
            'Контроль товщини ЛФП ультразвуковим сканером',
            'Фінішна антиголограмна обробка'
        ],
        'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80',
        false,
        1
    ),
    (
        'ceramic',
        'Нанокераміка 9H Pro',
        'ХІТ ЗАХИСТУ',
        'Нанесення багатошарової керамічної броні Gyeon Quartz з екстремальним гідрофобним ефектом та дзеркальною глибиною кольору.',
        16000,
        '2–3 дні',
        ARRAY[
            'Захист від дорожніх реагентів, смол і вигорання кольору',
            'Екстремальний водовідштовхувальний ефект',
            'Нанесення 2–4 шарів з ІЧ-сушкою',
            'Сертифікат і гарантія стійкості 24–36 місяців'
        ],
        'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=800&q=80',
        true,
        2
    ),
    (
        'interior',
        'Преміум-хімчистка салона',
        'СПА ДЛЯ САЛОНУ',
        'Делікатна хімчистка всіх поверхонь з озонуванням і консервацією шкіри натуральними швейцарськими складами.',
        7500,
        '1–2 дні',
        ARRAY[
            'Глибоке очищення шкіри, алькантари та текстилю',
            'Антибактеріальна обробка та озонування',
            'Живлення та захист шкіри кремами LeTech',
            'Безпечна еко-хімія без різких запахів'
        ],
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
        false,
        3
    ),
    (
        'ppf',
        'Обклеювання поліуретаном PPF',
        'БРОНЕПЛІВКА',
        'Невидимий бар’єр від відколів, гравію, подряпин та притертостей плівками преміум-сегмента SunTek та Stek.',
        32000,
        '2–4 дні',
        ARRAY[
            'Ефект самозатягування подряпин при нагріванні',
            'Товщина поліуретану до 220 мікронів',
            'Ідеальний розкрій за фірмовими лекалами',
            'Офіційна гарантія виробника 7 років'
        ],
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
        false,
        4
    )
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    tag = EXCLUDED.tag,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    duration_text = EXCLUDED.duration_text,
    features = EXCLUDED.features;

-- Пакети тарифів
INSERT INTO public.service_packages (title, tag, base_price, time_text, description, items, is_featured, sort_order)
VALUES
    (
        'Executive Care',
        'РЕГУЛЯРНИЙ ДОГЛЯД',
        4500,
        '4–6 годин',
        'Ідеальний комплекс для підтримки бездоганної чистоти кузова та затишку в салоні.',
        ARRAY[
            '3-фазне детейлінг-миття з пензлями',
            'Очищення дисків від гальмівного пилу',
            'Гідрофобне кварцове покриття ЛФП',
            'Делікатне прибирання салону пилососом і пензлями',
            'Кондиціонер для шкіри з матовим ефектом',
            'Матове чорніння гуми преміум-складом'
        ],
        false,
        1
    ),
    (
        'Ceramic Elite',
        'АБСОЛЮТНИЙ ХІТ',
        22000,
        '2 дні',
        'Максимальний глянець, усунення рисок та багатошаровий захист керамікою 9H.',
        ARRAY[
            'Повна деконтамінація ЛФП синтетичною глиною',
            'М’яке полірування з видаленням до 90% павутинки',
            '2 шари керамічного покриття 9H Pro',
            'Гідрофобний шар «Антидощ» на все скло',
            'Термосушка в ІЧ-камері для повної полімеризації',
            'Захисне просочення шкіряних елементів салону'
        ],
        true,
        2
    ),
    (
        'Royal Perfection',
        'ЕКСКЛЮЗИВНИЙ КОМПЛЕКС',
        55000,
        '3–4 дні',
        'Безкомпромісна реставрація, бронювання зон ризику та музейний рівень блиску.',
        ARRAY[
            'Глибоке відновлювальне полірування кузова',
            '3 шари нанокераміки 10H + гідрофобний Top Coat',
            'Обклеювання зон ризику поліуретановою плівкою PPF',
            'Повна хімчистка салону зі зняттям сидінь',
            'Озонування та дезінфекція системи кондиціонування',
            'Сертифікат та гарантійна книжка на 3 роки'
        ],
        false,
        3
    )
ON CONFLICT DO NOTHING;
