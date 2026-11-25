import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminContext, signOutAdmin } from '../lib/adminAuth';
import './AdminPage.css';

const statuses = [
  ['new', 'Нова'],
  ['confirmed', 'Підтверджена'],
  ['in_progress', 'У роботі'],
  ['completed', 'Завершена'],
  ['cancelled', 'Скасована'],
];

function statusLabel(value) {
  return statuses.find(([id]) => id === value)?.[1] ?? value;
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium' }).format(new Date(value + 'T12:00:00')) : 'Не вказано';
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [context, setContext] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (currentContext) => {
    const activeContext = currentContext ?? await getAdminContext();
    if (!activeContext.profile || !activeContext.supabase) {
      await signOutAdmin();
      navigate('/admin/login', { replace: true });
      return;
    }
    setContext(activeContext);
    const { data, error: listError } = await activeContext.supabase.rpc('admin_list_bookings');
    if (listError) setError('Не вдалося завантажити заявки.');
    else setRecords(data ?? []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) return load(); return undefined; });
    return () => { cancelled = true; };
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (type !== 'all' && record.type !== type) return false;
      if (status !== 'all' && record.status !== status) return false;
      if (!needle) return true;
      return [record.contact_name, record.contact_phone, record.service_name, record.car_model]
        .filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [query, records, status, type]);

  const selected = records.find((record) => record.id === selectedId) ?? filtered[0] ?? null;

  async function changeStatus(nextStatus) {
    if (!selected || saving || !context?.supabase || nextStatus === selected.status) return;
    setSaving(true);
    setError('');
    const { error: updateError } = await context.supabase.rpc('admin_update_booking_status', {
      p_booking_id: selected.id,
      p_status: nextStatus,
    });
    if (updateError) setError('Не вдалося змінити статус заявки.');
    else setRecords((current) => current.map((record) => record.id === selected.id ? { ...record, status: nextStatus } : record));
    setSaving(false);
  }

  async function logout() {
    await signOutAdmin();
    navigate('/admin/login', { replace: true });
  }

  return (
    <section className="admin-page" aria-labelledby="admin-title">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="cinema-label">PremiumWash · Адміністрування</p>
            <h1 className="cinema-heading" id="admin-title">Заявки та консультації</h1>
            {context?.profile && <p className="admin-muted">{context.user?.email} · {context.profile.role}</p>}
          </div>
          <button className="btn-outline cinema-button" type="button" onClick={logout}>Вийти</button>
        </header>
        <div className="admin-toolbar" aria-label="Фільтри заявок">
          <input type="search" placeholder="Пошук за контактом або послугою" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Тип заявки">
            <option value="all">Усі типи</option>
            <option value="booking">Онлайн-запис</option>
            <option value="consultation">Консультації</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Статус заявки">
            <option value="all">Усі статуси</option>
            {statuses.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        {loading ? <p className="admin-muted">Завантажуємо заявки…</p> : (
          <div className="admin-grid">
            <div className="admin-list" aria-label="Список заявок">
              {filtered.length === 0 && <p className="admin-muted">Заявок за цими умовами не знайдено.</p>}
              {filtered.map((record) => (
                <button className={`admin-list__item${selected?.id === record.id ? ' is-selected' : ''}`} type="button" key={record.id} onClick={() => setSelectedId(record.id)}>
                  <span><strong>{record.contact_name || 'Консультація'}</strong><small>{record.service_name || 'Телефонна консультація'}</small></span>
                  <span><strong>{statusLabel(record.status)}</strong><small>{formatDate(record.booking_date || record.created_at.slice(0, 10))}</small></span>
                </button>
              ))}
            </div>
            <article className="admin-detail" aria-live="polite">
              {!selected ? <p className="admin-muted">Оберіть заявку для перегляду.</p> : (
                <>
                  <div className="admin-detail__header">
                    <div><p className="cinema-label">{selected.type === 'booking' ? 'Онлайн-запис' : 'Консультація'}</p><h2>{selected.contact_name || 'Телефонна консультація'}</h2></div>
                    <span className="admin-status">{statusLabel(selected.status)}</span>
                  </div>
                  <dl className="admin-detail__facts">
                    <div><dt>Телефон</dt><dd>{selected.contact_phone}</dd></div>
                    <div><dt>Послуга</dt><dd>{selected.service_name || 'Не вказано'}</dd></div>
                    <div><dt>Автомобіль</dt><dd>{selected.car_model || 'Не вказано'}</dd></div>
                    <div><dt>Дата і час</dt><dd>{formatDate(selected.booking_date)} · {selected.time_slot || 'Не вказано'}</dd></div>
                    <div><dt>Коментар</dt><dd>{selected.comment || 'Немає'}</dd></div>
                  </dl>
                  <label className="admin-status-control">Статус
                    <select value={selected.status} onChange={(event) => changeStatus(event.target.value)} disabled={saving}>
                      {statuses.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  </label>
                </>
              )}
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
