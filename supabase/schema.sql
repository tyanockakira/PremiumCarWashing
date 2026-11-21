-- ==============================================================================
-- СХЕМА БАЗЫ ДАННЫХ ДЛЯ ДЕТЕЙЛИНГ-ЦЕНТРА PREMIUM CAR WASH (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. ТАБЛИЦА: Классы автомобилей (для калькулятора)
CREATE TABLE IF NOT EXISTS public.car_classes (
    id TEXT PRIMARY KEY, -- 'sedan', 'crossover', 'suv'
    label TEXT NOT NULL,
    multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    example_models TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ТАБЛИЦА: Услуги детейлинга (каталог)
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

-- 3. ТАБЛИЦА: Пакеты услуг (для калькулятора)
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

-- 4. ТАБЛИЦА: Клиенты
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

-- 5. ТАБЛИЦА: Автомобили клиентов
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    car_class_id TEXT REFERENCES public.car_classes(id) ON DELETE SET NULL,
    make_model TEXT NOT NULL,
    license_plate TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_client ON public.vehicles (client_id);

-- 6. ТАБЛИЦА: Заявки на запись и консультации
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

-- 7. ТАБЛИЦА: Профили администраторов
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('superadmin', 'admin', 'manager')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- БЕЗОПАСНОСТЬ: ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.car_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Публичное чтение каталога (любой посетитель видит активные услуги и цены)
CREATE POLICY "Public read active car_classes"
    ON public.car_classes FOR SELECT USING (true);

CREATE POLICY "Public read active services"
    ON public.services FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active service_packages"
    ON public.service_packages FOR SELECT USING (is_active = true);

-- Политики для авторизованных администраторов (полный доступ)
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
-- БЕЗОПАСНЫЕ ФУНКЦИИ (RPC) ДЛЯ ПУБЛИЧНОЙ ОТПРАВКИ ЗАЯВОК БЕЗ УТЕЧКИ ДАННЫХ
-- ==============================================================================

-- Функция 1: Оформление записи через модальное окно
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
SECURITY DEFINER -- Выполняется от имени сервера, скрывая внутреннюю таблицу клиентов от прямого доступа
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
    v_client_id UUID;
    v_vehicle_id UUID := NULL;
    v_booking_id UUID;
BEGIN
    -- Валидация входных данных
    IF TRIM(COALESCE(p_name, '')) = '' THEN
        RAISE EXCEPTION 'Имя обязательно для заполнения';
    END IF;

    IF TRIM(COALESCE(p_phone, '')) = '' THEN
        RAISE EXCEPTION 'Номер телефона обязателен для заполнения';
    END IF;

    -- Нормализация телефона (удаляем всё кроме цифр)
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_clean_phone) = 11 AND (v_clean_phone LIKE '7%' OR v_clean_phone LIKE '8%') THEN
        v_clean_phone := '+7' || substring(v_clean_phone from 2);
    ELSIF length(v_clean_phone) = 10 THEN
        v_clean_phone := '+7' || v_clean_phone;
    ELSE
        v_clean_phone := '+' || v_clean_phone;
    END IF;

    -- Поиск или создание клиента
    SELECT id INTO v_client_id FROM public.clients WHERE phone = v_clean_phone LIMIT 1;

    IF v_client_id IS NULL THEN
        INSERT INTO public.clients (full_name, phone)
        VALUES (TRIM(p_name), v_clean_phone)
        RETURNING id INTO v_client_id;
    ELSE
        -- Обновляем имя, если клиент уже обращался
        UPDATE public.clients
        SET full_name = TRIM(p_name), updated_at = NOW()
        WHERE id = v_client_id;
    END IF;

    -- Создание записи об авто, если указано
    IF TRIM(COALESCE(p_car, '')) <> '' THEN
        INSERT INTO public.vehicles (client_id, make_model)
        VALUES (v_client_id, TRIM(p_car))
        RETURNING id INTO v_vehicle_id;
    END IF;

    -- Создание самой заявки
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
        COALESCE(NULLIF(TRIM(p_service), ''), 'Индивидуальная консультация'),
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
        'message', 'Заявка успешно зарегистрирована'
    );
END;
$$;

-- Функция 2: Оформление быстрой заявки/вопроса из блока Контакты
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
        RAISE EXCEPTION 'Имя обязательно для заполнения';
    END IF;

    IF TRIM(COALESCE(p_phone, '')) = '' THEN
        RAISE EXCEPTION 'Номер телефона обязателен для заполнения';
    END IF;

    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF length(v_clean_phone) = 11 AND (v_clean_phone LIKE '7%' OR v_clean_phone LIKE '8%') THEN
        v_clean_phone := '+7' || substring(v_clean_phone from 2);
    ELSIF length(v_clean_phone) = 10 THEN
        v_clean_phone := '+7' || v_clean_phone;
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
        'Консультация технолога',
        NULLIF(TRIM(p_question), ''),
        'consultation',
        'new'
    )
    RETURNING id INTO v_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'message', 'Вопрос успешно передан мастеру'
    );
END;
$$;

-- Предоставляем право анонимным пользователям вызывать обе процедуры
GRANT EXECUTE ON FUNCTION public.submit_booking TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_consultation TO anon, authenticated;

-- ==============================================================================
-- СИДОВЫЕ ДАННЫЕ (SEED DATA): Заполнение базовых услуг и тарифов
-- ==============================================================================

-- Классы машин
INSERT INTO public.car_classes (id, label, multiplier, example_models, sort_order)
VALUES
    ('sedan', 'Седан / Купе', 1.00, 'BMW 3/5, Porsche 911, Mercedes E-Class', 1),
    ('crossover', 'Кроссовер', 1.20, 'BMW X3/X5, Porsche Macan/Cayenne', 2),
    ('suv', 'Внедорожник / SUV', 1.40, 'Mercedes G-Class, Range Rover, GLS', 3)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    multiplier = EXCLUDED.multiplier,
    example_models = EXCLUDED.example_models;

-- Услуги каталога
INSERT INTO public.services (slug, title, tag, description, base_price, duration_text, features, image_url, is_featured, sort_order)
VALUES
    (
        'polishing',
        'Восстановительная полировка',
        'ГЛУБОКИЙ ГЛЯНЕЦ',
        'Многоэтапное удаление царапин, паутинок и оксидного слоя с сохранением максимальной толщины заводского лака.',
        18000,
        '1–2 дня',
        ARRAY[
            'Устранение до 98% дефектов и рисок',
            'Пасты и полировальные круги Rupes & Koch Chemie',
            'Контроль толщины ЛКП ультразвуковым сканером',
            'Финишная антиголограммная обработка'
        ],
        'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80',
        false,
        1
    ),
    (
        'ceramic',
        'Нанокерамика 9H Pro',
        'ХИТ ЗАЩИТЫ',
        'Нанесение многослойной керамической брони Gyeon Quartz с гидрофобным эффектом и зеркальной глубиной цвета.',
        35000,
        '2–3 дня',
        ARRAY[
            'Защита от реагентов, смол и выгорания цвета',
            'Экстремальный водо- и грязеотталкивающий эффект',
            'Нанесение 2–4 слоёв с ИК-сушкой',
            'Сертификат и гарантия на стойкость 24–36 месяцев'
        ],
        'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=800&q=80',
        true,
        2
    ),
    (
        'interior',
        'Премиум-химчистка салона',
        'СПА ДЛЯ САЛОНА',
        'Деликатная химчистка всех поверхностей с озонированием и консервацией кожи натуральными швейцарскими составами.',
        16000,
        '1–2 дня',
        ARRAY[
            'Глубокая очистка кожи, алькантары и текстиля',
            'Антибактериальная обработка и озонирование',
            'Питание и защита кожи кремами LeTech',
            'Безопасная эко-химия без резких запахов'
        ],
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
        false,
        3
    ),
    (
        'ppf',
        'Оклейка полиуретаном PPF',
        'БРОНЕПЛЕНКА',
        'Невидимый барьер от сколов, гравия, царапин и притёртостей пленками премиум-сегмента SunTek и Stek.',
        65000,
        '2–4 дня',
        ARRAY[
            'Эффект самозатягивания царапин при нагреве',
            'Толщина полиуретана до 220 микрон',
            'Идеальный раскрой по фирменным лекалам',
            'Официальная гарантия производителя 7 лет'
        ],
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
        false,
        4
    )
ON CONFLICT (slug) DO NOTHING;

-- Пакеты тарифов
INSERT INTO public.service_packages (title, tag, base_price, time_text, description, items, is_featured, sort_order)
VALUES
    (
        'Executive Care',
        'РЕГУЛЯРНЫЙ УХОД',
        9500,
        '4–6 часов',
        'Идеальный комплекс для поддержания безупречной чистоты кузова и уюта в салоне.',
        ARRAY[
            '3-фазная детейлинг-мойка с кистями',
            'Очистка дисков от тормозной пыли',
            'Гидрофобное кварцевое покрытие ЛКП',
            'Деликатная уборка салона пылесосом и кистями',
            'Кондиционер для кожи с матовым эффектом',
            'Матовое чернение резины премиум-составом'
        ],
        false,
        1
    ),
    (
        'Ceramic Elite',
        'АБСОЛЮТНЫЙ ХИТ',
        48000,
        '2 дня',
        'Максимальный глянец, устранение рисок и многослойная защита керамикой 9H.',
        ARRAY[
            'Полная деконтаминация ЛКП синтетической глиной',
            'Мягкая полировка с удалением до 90% паутинки',
            '2 слоя керамического покрытия 9H Pro',
            'Гидрофобный слой «Антидождь» на все стёкла',
            'Термосушка в ИК-камере для закрепления',
            'Защитная пропитка кожаных элементов салона'
        ],
        true,
        2
    ),
    (
        'Royal Perfection',
        'ЭКСКЛЮЗИВНЫЙ КОМПЛЕКС',
        115000,
        '3–4 дня',
        'Бескомпромиссная реставрация, бронирование зон риска и музейный уровень блеска.',
        ARRAY[
            'Глубокая восстановительная полировка кузова',
            '3 слоя нанокерамики 10H + гидрофобный Top Coat',
            'Оклейка зон риска полиуретановой пленкой PPF',
            'Полная химчистка салона со снятием сидений',
            'Озонирование и дезинфекция системы кондиционирования',
            'Сертификат и гарантийная книжка на 3 года'
        ],
        false,
        3
    )
ON CONFLICT DO NOTHING;
