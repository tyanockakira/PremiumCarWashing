import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Отправка заявки на детейлинг через модальное окно бронирования
 */
export async function createBooking({ name, phone, car, service, date, timeSlot, comment }) {
  if (!isSupabaseConfigured || !supabase) {
    // Режим разработки без подключенного бэкенда: эмуляция сетевого запроса
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      demo: true,
      message: 'Заявка принята в демо-режиме (Supabase не настроен)'
    };
  }

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
    throw new Error(error.message || 'Ошибка при отправке заявки');
  }

  return data;
}

/**
 * Отправка вопроса / запроса на консультацию из блока контактов
 */
export async function createConsultation({ name, phone, carModel, question }) {
  if (!isSupabaseConfigured || !supabase) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      demo: true,
      message: 'Консультация принята в демо-режиме (Supabase не настроен)'
    };
  }

  const { data, error } = await supabase.rpc('submit_consultation', {
    p_name: name,
    p_phone: phone,
    p_car: carModel || null,
    p_question: question || null
  });

  if (error) {
    console.error('Supabase submit_consultation error:', error);
    throw new Error(error.message || 'Ошибка при отправке формы');
  }

  return data;
}

/**
 * Получение активных услуг из базы данных
 */
export async function getServices() {
  if (!isSupabaseConfigured || !supabase) {
    return null; // Вернет null для использования локального фоллбека
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Не удалось загрузить услуги из Supabase, используется локальный кэш:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Ошибка сети при загрузке услуг:', err);
    return null;
  }
}

/**
 * Получение тарифов и классов авто из базы данных
 */
export async function getPricingData() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const [classesRes, packagesRes] = await Promise.all([
      supabase.from('car_classes').select('*').order('sort_order', { ascending: true }),
      supabase.from('service_packages').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ]);

    if (classesRes.error || packagesRes.error) {
      console.warn('Не удалось загрузить тарифы из Supabase:', classesRes.error || packagesRes.error);
      return null;
    }

    return {
      carClasses: classesRes.data,
      packages: packagesRes.data
    };
  } catch (err) {
    console.warn('Ошибка сети при загрузке тарифов:', err);
    return null;
  }
}
