import { getSupabase, bookingMode } from '../lib/supabase';
import { phoneOnlyConsultationUnavailable } from '../lib/bookingValidation';

async function getLiveSupabase() {
  const supabase = await getSupabase();
  if (!supabase) {
    throw new Error('Реальний режим недоступний: Supabase не налаштовано.');
  }
  return supabase;
}

function validateBookingResponse(data, fallbackMessage) {
  if (data?.success !== true || !data.booking_id) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}

/**
 * Відправлення заявки на дітейлінг через модальне вікно або сторінку бронювання
 */
export async function createBooking({ name, phone, car, service, date, timeSlot, comment }) {
  if (bookingMode === 'demo') {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      demo: true,
      message: 'Заявку прийнято в демо-режимі (Supabase не налаштовано)'
    };
  }

  const supabase = await getLiveSupabase();

  const { data, error } = await supabase.rpc('submit_booking', {
    p_name: name,
    p_phone: phone,
    p_car: car || null,
    p_service: service || null,
    p_date: date || null,
    p_slot: timeSlot || null,
    p_comment: comment || null
  });

  if (error) {
    console.error('Supabase submit_booking error:', error);
    throw new Error(error.message || 'Помилка під час надсилання заявки');
  }

  return validateBookingResponse(data, 'Сервер не підтвердив збереження заявки.');
}

/**
 * Submit a consultation request through the configured booking mode.
 */
export async function createConsultation({ name, phone, carModel, question }) {
  if (bookingMode === 'demo') {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      demo: true,
      message: 'Запит на консультацію прийнято в демо-режимі'
    };
  }

  if (!name?.trim()) throw new Error(phoneOnlyConsultationUnavailable);
  const supabase = await getLiveSupabase();

  const { data, error } = await supabase.rpc('submit_consultation', {
    p_name: name,
    p_phone: phone,
    p_car: carModel || null,
    p_question: question || null
  });

  if (error) {
    console.error('Supabase submit_consultation error:', error);
    throw new Error(error.message || 'Помилка під час надсилання форми');
  }

  return validateBookingResponse(data, 'Сервер не підтвердив збереження запиту.');
}

/**
 * Отримання активних послуг із бази даних
 */
export async function getServices() {
  try {
    const supabase = await getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Не вдалося завантажити послуги із Supabase, використовується локальний кеш:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Помилка мережі під час завантаження послуг:', err);
    return null;
  }
}

/**
 * Отримання тарифів і класів авто із бази даних
 */
export async function getPricingData() {
  try {
    const supabase = await getSupabase();
    if (!supabase) return null;

    const [classesRes, packagesRes] = await Promise.all([
      supabase.from('car_classes').select('*').order('sort_order', { ascending: true }),
      supabase.from('service_packages').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ]);

    if (classesRes.error || packagesRes.error) {
      console.warn('Не вдалося завантажити тарифи із Supabase:', classesRes.error || packagesRes.error);
      return null;
    }

    return {
      carClasses: classesRes.data,
      packages: packagesRes.data
    };
  } catch (err) {
    console.warn('Помилка мережі під час завантаження тарифів:', err);
    return null;
  }
}
